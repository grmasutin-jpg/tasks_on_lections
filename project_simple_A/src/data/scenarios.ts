export type StrategyType = 'strategyA' | 'strategyB';

export interface StepOption {
  id: string;
  expression: string;
  actionLabel: string;
  isCorrect: boolean;
  errorType?: 'sign_parentheses' | 'incomplete_multiply' | 'combine_terms_sign' | 'transfer_sign';
  errorTitle?: string;
  /** Short pedagogical explanation of why this mistake happens */
  diagnosticSummary?: string;
}

export interface MicroRemediationData {
  substepId: string;
  title: string;
  ruleName: string;
  brokenExpression: string;
  correctExpression: string;
  visualExplanation: string;
  highlightBadToken: string;
  highlightGoodToken: string;
  microQuestion: {
    prompt: string;
    expressionToTransform: string;
    options: {
      id: string;
      text: string;
      isCorrect: boolean;
      feedback: string;
    }[];
  };
}

export interface ConsequenceBranchData {
  branchId: string;
  originStepNumber: 1 | 2;
  flawedEquationAtOrigin: string;
  errorTitle: string;
  /** If error happened at Step 1, student also performs Step 2* on their flawed equation */
  step2Star?: {
    prompt: string;
    currentEquation: string;
    options: {
      id: string;
      expression: string;
      actionLabel: string;
      isCorrectForBranch: boolean;
    }[];
    targetExpression: string;
    explanation: string;
  };
  /** Step 3*: Finding the root from the flawed simplified equation */
  step3Star: {
    prompt: string;
    currentEquation: string;
    options: {
      id: string;
      expression: string;
      actionLabel: string;
      isCorrectForBranch: boolean;
    }[];
    derivedRoot: number;
    derivedRootExpression: string;
    explanation: string;
  };
  /** Step 4*: Substitution check in original equation */
  step4StarCheck: {
    originalEquation: string;
    substitutedExpressionLeft: string;
    substitutedValueLeft: number;
    expectedValueRight: number;
    verificationPrompt: string;
    options: {
      id: string;
      text: string;
      isCorrect: boolean;
    }[];
  };
  /** Step 5*: Detective pinpointing the broken equivalence step */
  step5StarDetective: {
    prompt: string;
    derivationChain: {
      stepLabel: string;
      expression: string;
      isBrokenTransition: boolean;
      hint: string;
    }[];
    finalFixSummary: string;
  };
}

export interface CanonicalStep {
  stepNumber: 1 | 2 | 3;
  title: string;
  subtitle: string;
  goalDescription: string;
  inputEquation: string;
  targetEquation: string;
  acceptableNormalizedInputs: string[];
  ruleHint: string;
  options: StepOption[];
  /** Keyed by option.id for wrong options */
  remediationsA: Record<string, MicroRemediationData>;
  consequencesB: Record<string, ConsequenceBranchData>;
}

export interface EquationScenario {
  id: string;
  badge: string;
  title: string;
  gradeLevel: string;
  difficulty: 'Базовый+' | 'Средний' | 'Продвинутый';
  originalEquation: string;
  trueRoot: number;
  trueRootExpression: string;
  initialLeftLabel: string;
  initialRightLabel: string;
  verifiedValueBothSides: number;
  description: string;
  trapHighlight: string;
  steps: [CanonicalStep, CanonicalStep, CanonicalStep];
}

export const SCENARIOS: EquationScenario[] = [
  {
    id: 'linear-brackets-sign-trap',
    badge: 'Основной сценарий',
    title: 'Раскрытие скобок и «ловушка минуса»',
    gradeLevel: '7 класс • Линейные уравнения',
    difficulty: 'Средний',
    originalEquation: '3(x - 2) - (x + 4) = 4',
    trueRoot: 7,
    trueRootExpression: 'x = 7',
    initialLeftLabel: '3(x - 2) - (x + 4)',
    initialRightLabel: '4',
    verifiedValueBothSides: 4,
    description:
      'Классическое уравнение, на котором 68% школьников совершают ошибку знака при раскрытии скобок, перед которыми стоит минус, либо при сложении отрицательных чисел.',
    trapHighlight: 'Опасный участок: -(x + 4) и сложение -6 - 4',
    steps: [
      {
        stepNumber: 1,
        title: 'Шаг 1. Раскрытие скобок',
        subtitle: 'Примените распределительный закон умножения и правило знака перед скобкой',
        goalDescription: 'Избавьтесь от скобок в левой части уравнения 3(x - 2) - (x + 4) = 4',
        inputEquation: '3(x - 2) - (x + 4) = 4',
        targetEquation: '3x - 6 - x - 4 = 4',
        acceptableNormalizedInputs: [
          '3x-6-x-4=4',
          '3*x-6-x-4=4',
          '3x-x-6-4=4',
        ],
        ruleHint: 'При раскрытии скобок с минусом впереди: -(a + b) = -a - b. Все знаки внутри меняются на противоположные.',
        options: [
          {
            id: 's1-correct',
            expression: '3x - 6 - x - 4 = 4',
            actionLabel: 'Умножить 3 на (x - 2) и поменять оба знака в (x + 4)',
            isCorrect: true,
          },
          {
            id: 's1-err-sign',
            expression: '3x - 6 - x + 4 = 4',
            actionLabel: 'Раскрыть скобки: 3x - 6 и вычесть x, оставив + 4',
            isCorrect: false,
            errorType: 'sign_parentheses',
            errorTitle: 'Ловушка знака перед скобкой -(x + 4)',
            diagnosticSummary: 'Минус перед скобкой относится ко ВСЕМ слагаемым внутри скобки, а не только к первому.',
          },
          {
            id: 's1-err-mult',
            expression: '3x - 2 - x - 4 = 4',
            actionLabel: 'Умножить 3 на x, переписать -2 и раскрыть -(x + 4)',
            isCorrect: false,
            errorType: 'incomplete_multiply',
            errorTitle: 'Неполное применение распределительного закона 3(x - 2)',
            diagnosticSummary: 'Множитель 3 перед скобкой нужно умножить на каждое слагаемое внутри: и на x, и на -2.',
          },
        ],
        remediationsA: {
          's1-err-sign': {
            substepId: '1.1',
            title: 'Подшаг 1.1. Разбор ловушки: минус перед скобками',
            ruleName: 'Правило инверсии знаков: -(a + b) = -a - b',
            brokenExpression: '3x - 6 - x + 4 = 4',
            correctExpression: '3x - 6 - x - 4 = 4',
            visualExplanation:
              'Выражение -(x + 4) означает -1 · (x + 4). Умножая -1 на +x, получаем -x. Умножая -1 на +4, обязательно получаем -4, а не +4!',
            highlightBadToken: '+ 4',
            highlightGoodToken: '- 4',
            microQuestion: {
              prompt: 'Мини-тренажёр: раскройте скобки в выражении 12 - (x + 5)',
              expressionToTransform: '12 - (x + 5)',
              options: [
                {
                  id: 'mq1-a',
                  text: '12 - x - 5',
                  isCorrect: true,
                  feedback: 'Отлично! Минус перед скобкой поменял знак и у x, и у 5.',
                },
                {
                  id: 'mq1-b',
                  text: '12 - x + 5',
                  isCorrect: false,
                  feedback: 'Осторожно: знак перед 5 тоже должен измениться на противоположный (-5).',
                },
                {
                  id: 'mq1-c',
                  text: '12 + x - 5',
                  isCorrect: false,
                  feedback: 'Перед x внутри скобок стоял плюс, значит после раскрытия будет -x.',
                },
              ],
            },
          },
          's1-err-mult': {
            substepId: '1.1',
            title: 'Подшаг 1.1. Разбор ловушки: фонтанчик умножения',
            ruleName: 'Распределительный закон: a(b - c) = ab - ac',
            brokenExpression: '3x - 2 - x - 4 = 4',
            correctExpression: '3x - 6 - x - 4 = 4',
            visualExplanation:
              'В выражении 3(x - 2) число 3 умножается на всю скобку целиком: 3 · x - 3 · 2 = 3x - 6. Число -2 нельзя оставлять без умножения на 3.',
            highlightBadToken: '- 2',
            highlightGoodToken: '- 6',
            microQuestion: {
              prompt: 'Мини-тренажёр: раскройте скобки в выражении 4(x - 3)',
              expressionToTransform: '4(x - 3)',
              options: [
                {
                  id: 'mq2-a',
                  text: '4x - 12',
                  isCorrect: true,
                  feedback: 'Верно! 4 · x = 4x и 4 · (-3) = -12.',
                },
                {
                  id: 'mq2-b',
                  text: '4x - 3',
                  isCorrect: false,
                  feedback: 'Не забудьте умножить второе число в скобках (-3) на 4.',
                },
                {
                  id: 'mq2-c',
                  text: '4x + 12',
                  isCorrect: false,
                  feedback: 'При умножении положительного числа 4 на -3 знак остаётся минусом (-12).',
                },
              ],
            },
          },
        },
        consequencesB: {
          's1-err-sign': {
            branchId: 'b-s1-sign',
            originStepNumber: 1,
            flawedEquationAtOrigin: '3x - 6 - x + 4 = 4',
            errorTitle: 'Сохранение знака +4 при раскрытии -(x + 4)',
            step2Star: {
              prompt: 'Приведите подобные слагаемые в полученном вами уравнении 3x - 6 - x + 4 = 4:',
              currentEquation: '3x - 6 - x + 4 = 4',
              options: [
                {
                  id: 'b2-1',
                  expression: '2x - 2 = 4',
                  actionLabel: 'Сгруппировать (3x - x) = 2x и (-6 + 4) = -2',
                  isCorrectForBranch: true,
                },
                {
                  id: 'b2-2',
                  expression: '4x - 2 = 4',
                  actionLabel: 'Сложить 3x + x = 4x и (-6 + 4) = -2',
                  isCorrectForBranch: false,
                },
              ],
              targetExpression: '2x - 2 = 4',
              explanation: 'В вашем уравнении 3x - x = 2x, а для чисел -6 + 4 = -2. Получаем следствие: 2x - 2 = 4.',
            },
            step3Star: {
              prompt: 'Найдите корень x из вашего упрощённого уравнения 2x - 2 = 4:',
              currentEquation: '2x - 2 = 4',
              options: [
                {
                  id: 'b3-1',
                  expression: 'x = 3',
                  actionLabel: 'Перенести -2 вправо (2x = 6) и разделить на 2',
                  isCorrectForBranch: true,
                },
                {
                  id: 'b3-2',
                  expression: 'x = 1',
                  actionLabel: 'Вычесть 2 из 4 (2x = 2) и разделить на 2',
                  isCorrectForBranch: false,
                },
              ],
              derivedRoot: 3,
              derivedRootExpression: 'x = 3',
              explanation: 'Из уравнения 2x - 2 = 4 следует 2x = 6, откуда получаем ваш кандидат в корни: x = 3.',
            },
            step4StarCheck: {
              originalEquation: '3(x - 2) - (x + 4) = 4',
              substitutedExpressionLeft: '3(3 - 2) - (3 + 4) = 3 · 1 - 7 = -4',
              substitutedValueLeft: -4,
              expectedValueRight: 4,
              verificationPrompt:
                'Мы подставили ваш корень x = 3 в ИСХОДНОЕ уравнение. Слева получилось -4, а справа 4 (-4 ≠ 4). Какой вывод из этого следует?',
              options: [
                {
                  id: 'v-1',
                  text: 'Равенство нарушено (-4 ≠ 4), значит x = 3 не является решением, а на одном из шагов была нарушена равносильность',
                  isCorrect: true,
                },
                {
                  id: 'v-2',
                  text: 'В исходном уравнении опечатка, так как 2x = 6 решено правильно',
                  isCorrect: false,
                },
              ],
            },
            step5StarDetective: {
              prompt: 'Детектив ошибки: нажмите на строку в вашей цепочке рассуждений, где впервые возникло неверное преобразование:',
              derivationChain: [
                {
                  stepLabel: 'Исходное уравнение',
                  expression: '3(x - 2) - (x + 4) = 4',
                  isBrokenTransition: false,
                  hint: 'Это условие задачи — оно абсолютно верное.',
                },
                {
                  stepLabel: 'Переход к Шагу 1',
                  expression: '3x - 6 - x + 4 = 4',
                  isBrokenTransition: true,
                  hint: 'Бинго! При раскрытии скобки -(x + 4) знак перед 4 не поменялся: вместо +4 должно быть -4!',
                },
                {
                  stepLabel: 'Переход к Шагу 2*',
                  expression: '2x - 2 = 4',
                  isBrokenTransition: false,
                  hint: 'Арифметически для предыдущей строки (-6 + 4 = -2) это было посчитано верно, но ошибка закралась раньше.',
                },
                {
                  stepLabel: 'Переход к Шагу 3*',
                  expression: 'x = 3',
                  isBrokenTransition: false,
                  hint: 'Из 2x - 2 = 4 действительно следует x = 3. Проблема возникла на более раннем шаге.',
                },
              ],
              finalFixSummary:
                'Заменив +4 на -4 на Шаге 1, получаем 3x - 6 - x - 4 = 4 → 2x - 10 = 4 → 2x = 14 → x = 7. Проверка: 3(7 - 2) - (7 + 4) = 15 - 11 = 4 (Весы в равновесии!).',
            },
          },
          's1-err-mult': {
            branchId: 'b-s1-mult',
            originStepNumber: 1,
            flawedEquationAtOrigin: '3x - 2 - x - 4 = 4',
            errorTitle: 'Пропуск умножения -2 на 3 при раскрытии 3(x - 2)',
            step2Star: {
              prompt: 'Приведите подобные слагаемые в вашем уравнении 3x - 2 - x - 4 = 4:',
              currentEquation: '3x - 2 - x - 4 = 4',
              options: [
                {
                  id: 'bm2-1',
                  expression: '2x - 6 = 4',
                  actionLabel: 'Сгруппировать (3x - x) = 2x и (-2 - 4) = -6',
                  isCorrectForBranch: true,
                },
                {
                  id: 'bm2-2',
                  expression: '2x + 6 = 4',
                  actionLabel: 'Сгруппировать 2x и сложить +6',
                  isCorrectForBranch: false,
                },
              ],
              targetExpression: '2x - 6 = 4',
              explanation: 'В вашем уравнении 3x - x = 2x и -2 - 4 = -6. Получаем 2x - 6 = 4.',
            },
            step3Star: {
              prompt: 'Найдите корень x из вашего уравнения 2x - 6 = 4:',
              currentEquation: '2x - 6 = 4',
              options: [
                {
                  id: 'bm3-1',
                  expression: 'x = 5',
                  actionLabel: 'Перенести -6 вправо (2x = 10) и разделить на 2',
                  isCorrectForBranch: true,
                },
                {
                  id: 'bm3-2',
                  expression: 'x = -1',
                  actionLabel: 'Вычесть 6 из 4 и разделить на 2',
                  isCorrectForBranch: false,
                },
              ],
              derivedRoot: 5,
              derivedRootExpression: 'x = 5',
              explanation: 'Из 2x - 6 = 4 получаем 2x = 10, значит x = 5.',
            },
            step4StarCheck: {
              originalEquation: '3(x - 2) - (x + 4) = 4',
              substitutedExpressionLeft: '3(5 - 2) - (5 + 4) = 3 · 3 - 9 = 0',
              substitutedValueLeft: 0,
              expectedValueRight: 4,
              verificationPrompt:
                'Подставим ваш корень x = 5 в исходное уравнение: 3(5 - 2) - (5 + 4) = 9 - 9 = 0. Слева 0, а справа 4 (0 ≠ 4). Что это значит?',
              options: [
                {
                  id: 'vm-1',
                  text: 'Корень x = 5 не подходит к исходному уравнению (0 ≠ 4) — в цепочке преобразований была допущена ошибка',
                  isCorrect: true,
                },
                {
                  id: 'vm-2',
                  text: 'Ноль всегда можно приравнять к четырём',
                  isCorrect: false,
                },
              ],
            },
            step5StarDetective: {
              prompt: 'Детектив ошибки: укажите шаг, на котором произошло неравносильное преобразование:',
              derivationChain: [
                {
                  stepLabel: 'Исходное уравнение',
                  expression: '3(x - 2) - (x + 4) = 4',
                  isBrokenTransition: false,
                  hint: 'Это исходное уравнение.',
                },
                {
                  stepLabel: 'Переход к Шагу 1',
                  expression: '3x - 2 - x - 4 = 4',
                  isBrokenTransition: true,
                  hint: 'Точно! При раскрытии 3(x - 2) тройку умножили на x, но забыли умножить на -2 (должно быть 3x - 6).',
                },
                {
                  stepLabel: 'Переход к Шагу 2*',
                  expression: '2x - 6 = 4',
                  isBrokenTransition: false,
                  hint: 'Переход от 3x - 2 - x - 4 к 2x - 6 выполнен верно, ошибка случилась раньше.',
                },
                {
                  stepLabel: 'Переход к Шагу 3*',
                  expression: 'x = 5',
                  isBrokenTransition: false,
                  hint: 'Для 2x - 6 = 4 число 5 действительно корень.',
                },
              ],
              finalFixSummary:
                'Умножив 3 на оба члена скобки (x - 2), получаем 3x - 6 - x - 4 = 4 → 2x - 10 = 4 → x = 7.',
            },
          },
        },
      },
      {
        stepNumber: 2,
        title: 'Шаг 2. Приведение подобных слагаемых',
        subtitle: 'Сгруппируйте слагаемые с переменной x и свободные числа в левой части',
        goalDescription: 'Упростите левую часть уравнения 3x - 6 - x - 4 = 4',
        inputEquation: '3x - 6 - x - 4 = 4',
        targetEquation: '2x - 10 = 4',
        acceptableNormalizedInputs: [
          '2x-10=4',
          '2*x-10=4',
          '-10+2x=4',
        ],
        ruleHint: 'Сложите коэффициенты при x: (3x - 1x = 2x) и отдельно сложите отрицательные числа: (-6 - 4 = -10).',
        options: [
          {
            id: 's2-correct',
            expression: '2x - 10 = 4',
            actionLabel: 'Вычислить 3x - x = 2x и сложить -6 - 4 = -10',
            isCorrect: true,
          },
          {
            id: 's2-err-neg',
            expression: '2x - 2 = 4',
            actionLabel: 'Вычислить 3x - x = 2x и для чисел записать -6 - 4 = -2',
            isCorrect: false,
            errorType: 'combine_terms_sign',
            errorTitle: 'Ошибка при сложении двух отрицательных чисел (-6 - 4)',
            diagnosticSummary: 'При вычитании 4 из -6 мы двигаемся по числовой прямой ещё левее: -6 - 4 = -10, а не -2.',
          },
        ],
        remediationsA: {
          's2-err-neg': {
            substepId: '2.1',
            title: 'Подшаг 2.1. Сложение отрицательных чисел на числовой оси',
            ruleName: 'Правило знаков: -a - b = -(a + b)',
            brokenExpression: '2x - 2 = 4',
            correctExpression: '2x - 10 = 4',
            visualExplanation:
              'Числа -6 и -4 имеют одинаковый знак (минус). Когда оба числа отрицательные, их модули складываются, а знак минус сохраняется: -(6 + 4) = -10.',
            highlightBadToken: '- 2',
            highlightGoodToken: '- 10',
            microQuestion: {
              prompt: 'Мини-тренажёр: чему равно выражение -8 - 5?',
              expressionToTransform: '-8 - 5',
              options: [
                {
                  id: 'mq21-a',
                  text: '-13',
                  isCorrect: true,
                  feedback: 'Точно! Два шага влево от нуля (-8 и ещё -5) дают -13.',
                },
                {
                  id: 'mq21-b',
                  text: '-3',
                  isCorrect: false,
                  feedback: '-3 получилось бы при выражении -8 + 5, а у нас оба числа со знаком минус.',
                },
                {
                  id: 'mq21-c',
                  text: '+13',
                  isCorrect: false,
                  feedback: 'Плюс на минус меняется при умножении, а при сложении двух отрицательных чисел знак остаётся минусом.',
                },
              ],
            },
          },
        },
        consequencesB: {
          's2-err-neg': {
            branchId: 'b-s2-neg',
            originStepNumber: 2,
            flawedEquationAtOrigin: '2x - 2 = 4',
            errorTitle: 'Замена -6 - 4 на -2 при приведении подобных',
            step3Star: {
              prompt: 'Продолжим решение вашего уравнения 2x - 2 = 4. Найдите из него x:',
              currentEquation: '2x - 2 = 4',
              options: [
                {
                  id: 'bs2-3-1',
                  expression: 'x = 3',
                  actionLabel: 'Перенести -2 вправо (2x = 6) и разделить на 2',
                  isCorrectForBranch: true,
                },
                {
                  id: 'bs2-3-2',
                  expression: 'x = 1',
                  actionLabel: 'Вычесть 2 из 4 и разделить на 2',
                  isCorrectForBranch: false,
                },
              ],
              derivedRoot: 3,
              derivedRootExpression: 'x = 3',
              explanation: 'Из уравнения 2x - 2 = 4 следует 2x = 6, откуда ваш корень x = 3.',
            },
            step4StarCheck: {
              originalEquation: '3(x - 2) - (x + 4) = 4',
              substitutedExpressionLeft: '3(3 - 2) - (3 + 4) = 3 · 1 - 7 = -4',
              substitutedValueLeft: -4,
              expectedValueRight: 4,
              verificationPrompt:
                'Проверим корень x = 3 подстановкой в исходное уравнение: слева получается -4, а справа 4 (-4 ≠ 4). О чём это говорит?',
              options: [
                {
                  id: 'vs2-1',
                  text: 'Равенство не выполняется (-4 ≠ 4) — на одном из шагов упрощения была допущена ошибка',
                  isCorrect: true,
                },
                {
                  id: 'vs2-2',
                  text: 'Знак минуса в ответе можно просто не учитывать',
                  isCorrect: false,
                },
              ],
            },
            step5StarDetective: {
              prompt: 'Детектив ошибки: найдите шаг, где нарушилась равносильность:',
              derivationChain: [
                {
                  stepLabel: 'Исходное уравнение',
                  expression: '3(x - 2) - (x + 4) = 4',
                  isBrokenTransition: false,
                  hint: 'Исходное условие задачи.',
                },
                {
                  stepLabel: 'Переход к Шагу 1 (Выполнено верно)',
                  expression: '3x - 6 - x - 4 = 4',
                  isBrokenTransition: false,
                  hint: 'Скобки раскрыты абсолютно правильно!',
                },
                {
                  stepLabel: 'Переход к Шагу 2',
                  expression: '2x - 2 = 4',
                  isBrokenTransition: true,
                  hint: 'Найдено! При сложении -6 - 4 получилось -2 вместо -10. Должно быть 2x - 10 = 4.',
                },
                {
                  stepLabel: 'Переход к Шагу 3*',
                  expression: 'x = 3',
                  isBrokenTransition: false,
                  hint: 'Это верное следствие из неверного уравнения 2x - 2 = 4.',
                },
              ],
              finalFixSummary:
                'Исправив -6 - 4 = -10 на Шаге 2, получаем 2x - 10 = 4 → 2x = 14 → x = 7. Проверка: 3(7-2) - (7+4) = 15 - 11 = 4!',
            },
          },
        },
      },
      {
        stepNumber: 3,
        title: 'Шаг 3. Нахождение корня уравнения',
        subtitle: 'Перенесите свободное слагаемое в правую часть с противоположным знаком и разделите на коэффициент при x',
        goalDescription: 'Найдите значение x из уравнения 2x - 10 = 4',
        inputEquation: '2x - 10 = 4',
        targetEquation: 'x = 7',
        acceptableNormalizedInputs: ['x=7', '7', '2x=14'],
        ruleHint: 'При переносе -10 через знак «=» его знак меняется на +10: 2x = 4 + 10 → 2x = 14 → x = 7.',
        options: [
          {
            id: 's3-correct',
            expression: 'x = 7',
            actionLabel: 'Перенести -10 вправо с плюсом (2x = 14) и разделить на 2',
            isCorrect: true,
          },
          {
            id: 's3-err-transfer',
            expression: 'x = -3',
            actionLabel: 'Вычесть 10 из 4 (2x = -6) и разделить на 2',
            isCorrect: false,
            errorType: 'transfer_sign',
            errorTitle: 'Забыли поменять знак при переносе -10 через «=»',
            diagnosticSummary: 'При переносе слагаемого из одной части уравнения в другую его знак обязательно меняется на противоположный.',
          },
        ],
        remediationsA: {
          's3-err-transfer': {
            substepId: '3.1',
            title: 'Подшаг 3.1. Правило переноса через знак равенства',
            ruleName: 'Равносильный перенос: ax - b = c ⇔ ax = c + b',
            brokenExpression: '2x = 4 - 10  (x = -3)',
            correctExpression: '2x = 4 + 10  (x = 7)',
            visualExplanation:
              'Чтобы избавиться от -10 в левой части, мы прибавляем +10 к обеим чашам весов: (2x - 10) + 10 = 4 + 10, поэтому справа получается 14.',
            highlightBadToken: '4 - 10',
            highlightGoodToken: '4 + 10',
            microQuestion: {
              prompt: 'Мини-тренажёр: какое уравнение получится после переноса -7 в правую часть в 3x - 7 = 8?',
              expressionToTransform: '3x - 7 = 8',
              options: [
                {
                  id: 'mq31-a',
                  text: '3x = 8 + 7',
                  isCorrect: true,
                  feedback: 'Верно! Минус 7 при переходе через «=» превращается в плюс 7.',
                },
                {
                  id: 'mq31-b',
                  text: '3x = 8 - 7',
                  isCorrect: false,
                  feedback: 'Знак при переносе через «=» должен измениться на противоположный.',
                },
              ],
            },
          },
        },
        consequencesB: {
          's3-err-transfer': {
            branchId: 'b-s3-transfer',
            originStepNumber: 2,
            flawedEquationAtOrigin: '2x = -6',
            errorTitle: 'Сохранение минуса при переносе -10 в правую часть',
            step3Star: {
              prompt: 'Вы получили корень x = -3. Давайте перейдём к его проверке в исходном уравнении!',
              currentEquation: '2x = -6',
              options: [
                {
                  id: 'bs3-1',
                  expression: 'x = -3',
                  actionLabel: 'Перейти к проверке корня x = -3 подстановкой',
                  isCorrectForBranch: true,
                },
              ],
              derivedRoot: -3,
              derivedRootExpression: 'x = -3',
              explanation: 'Проверим гипотезу x = -3 подстановкой в исходное уравнение.',
            },
            step4StarCheck: {
              originalEquation: '3(x - 2) - (x + 4) = 4',
              substitutedExpressionLeft: '3(-3 - 2) - (-3 + 4) = 3 · (-5) - 1 = -16',
              substitutedValueLeft: -16,
              expectedValueRight: 4,
              verificationPrompt:
                'Подставим x = -3 в исходное уравнение: слева получается -16, а справа 4 (-16 ≠ 4). Что это доказывает?',
              options: [
                {
                  id: 'vs3-1',
                  text: 'Корень x = -3 неверен (-16 ≠ 4), ошибка произошла при переносе -10 в правую часть',
                  isCorrect: true,
                },
                {
                  id: 'vs3-2',
                  text: 'Отрицательные корни не подставляются в скобки',
                  isCorrect: false,
                },
              ],
            },
            step5StarDetective: {
              prompt: 'Детектив ошибки: отметьте строку, где нарушилось правило переноса:',
              derivationChain: [
                {
                  stepLabel: 'Шаг 2 (Верное уравнение)',
                  expression: '2x - 10 = 4',
                  isBrokenTransition: false,
                  hint: 'Здесь всё верно.',
                },
                {
                  stepLabel: 'Переход к Шагу 3',
                  expression: '2x = 4 - 10 → x = -3',
                  isBrokenTransition: true,
                  hint: 'Точно! При переносе -10 вправо знак должен поменяться на плюс: 2x = 4 + 10 = 14 → x = 7.',
                },
              ],
              finalFixSummary:
                'Прибавив 10 к обеим частям 2x - 10 = 4, получаем 2x = 14 → x = 7. Проверка: 3(7-2) - (7+4) = 4!',
            },
          },
        },
      },
    ],
  },
  {
    id: 'variables-both-sides',
    badge: 'Сценарий 2',
    title: 'Неизвестное в обеих частях уравнения',
    gradeLevel: '7 класс • Перенос слагаемых',
    difficulty: 'Базовый+',
    originalEquation: '5x - 3 = 2(x + 6)',
    trueRoot: 5,
    trueRootExpression: 'x = 5',
    initialLeftLabel: '5x - 3',
    initialRightLabel: '2(x + 6)',
    verifiedValueBothSides: 22,
    description:
      'Уравнение с переменной в обеих частях. Типичные ошибки — забыть умножить второе число в скобке или не поменять знак при встречном переносе слагаемых.',
    trapHighlight: 'Опасный участок: раскрытие 2(x + 6) и перенос 2x влево / -3 вправо',
    steps: [
      {
        stepNumber: 1,
        title: 'Шаг 1. Раскрытие скобок в правой части',
        subtitle: 'Умножьте множитель 2 на каждое слагаемое в скобках (x + 6)',
        goalDescription: 'Раскройте скобки в уравнении 5x - 3 = 2(x + 6)',
        inputEquation: '5x - 3 = 2(x + 6)',
        targetEquation: '5x - 3 = 2x + 12',
        acceptableNormalizedInputs: ['5x-3=2x+12', '5*x-3=2*x+12'],
        ruleHint: 'По распределительному закону 2(x + 6) = 2·x + 2·6 = 2x + 12.',
        options: [
          {
            id: 's2-1-correct',
            expression: '5x - 3 = 2x + 12',
            actionLabel: 'Умножить 2 на x и 2 на 6 (получить 2x + 12)',
            isCorrect: true,
          },
          {
            id: 's2-1-err',
            expression: '5x - 3 = 2x + 6',
            actionLabel: 'Умножить 2 на x и переписать + 6 без изменения',
            isCorrect: false,
            errorType: 'incomplete_multiply',
            errorTitle: 'Забыли умножить второе слагаемое скобки на 2',
            diagnosticSummary: 'Коэффициент 2 перед скобкой умножается на каждое слагаемое внутри скобки: 2 · 6 = 12.',
          },
        ],
        remediationsA: {
          's2-1-err': {
            substepId: '1.1',
            title: 'Подшаг 1.1. Правило раскрытия скобок a(x + b)',
            ruleName: 'Распределительный закон: a(x + b) = ax + ab',
            brokenExpression: '5x - 3 = 2x + 6',
            correctExpression: '5x - 3 = 2x + 12',
            visualExplanation:
              'Множитель 2 перед скобкой (x + 6) увеличивает в два раза всю сумму: и x, и число 6. Поэтому 2 · 6 = 12.',
            highlightBadToken: '+ 6',
            highlightGoodToken: '+ 12',
            microQuestion: {
              prompt: 'Мини-тренажёр: раскройте скобки в выражении 3(x + 4)',
              expressionToTransform: '3(x + 4)',
              options: [
                {
                  id: 'mqs2-1',
                  text: '3x + 12',
                  isCorrect: true,
                  feedback: 'Верно! 3 · x + 3 · 4 = 3x + 12.',
                },
                {
                  id: 'mqs2-2',
                  text: '3x + 4',
                  isCorrect: false,
                  feedback: 'Четвёрку внутри скобки тоже нужно умножить на 3.',
                },
              ],
            },
          },
        },
        consequencesB: {
          's2-1-err': {
            branchId: 'b2-s1-err',
            originStepNumber: 1,
            flawedEquationAtOrigin: '5x - 3 = 2x + 6',
            errorTitle: 'Неполное раскрытие скобок 2(x + 6) → 2x + 6',
            step2Star: {
              prompt: 'Перенесите слагаемые с x влево, а числа вправо в вашем уравнении 5x - 3 = 2x + 6:',
              currentEquation: '5x - 3 = 2x + 6',
              options: [
                {
                  id: 'b2s2-1',
                  expression: '3x = 9',
                  actionLabel: 'Вычислить 5x - 2x = 3x и 6 + 3 = 9',
                  isCorrectForBranch: true,
                },
                {
                  id: 'b2s2-2',
                  expression: '7x = 9',
                  actionLabel: 'Сложить 5x + 2x = 7x',
                  isCorrectForBranch: false,
                },
              ],
              targetExpression: '3x = 9',
              explanation: 'Для уравнения 5x - 3 = 2x + 6 после переноса получаем 3x = 9.',
            },
            step3Star: {
              prompt: 'Найдите x из вашего уравнения 3x = 9:',
              currentEquation: '3x = 9',
              options: [
                {
                  id: 'b2s3-1',
                  expression: 'x = 3',
                  actionLabel: 'Разделить обе части на 3',
                  isCorrectForBranch: true,
                },
              ],
              derivedRoot: 3,
              derivedRootExpression: 'x = 3',
              explanation: 'Из 3x = 9 получаем кандидат в корни x = 3.',
            },
            step4StarCheck: {
              originalEquation: '5x - 3 = 2(x + 6)',
              substitutedExpressionLeft: 'ЛЧ: 5·3 - 3 = 12 | ПЧ: 2(3 + 6) = 18',
              substitutedValueLeft: 12,
              expectedValueRight: 18,
              verificationPrompt:
                'При подстановке x = 3 в исходное уравнение 5x - 3 = 2(x + 6) слева получилось 12, а справа 18 (12 ≠ 18). Почему весы не сошлись?',
              options: [
                {
                  id: 'b2v-1',
                  text: 'Равенство 12 = 18 ложно, значит при раскрытии скобок или переносе была нарушена равносильность',
                  isCorrect: true,
                },
                {
                  id: 'b2v-2',
                  text: 'Разница в 6 единиц допустима для линейных уравнений',
                  isCorrect: false,
                },
              ],
            },
            step5StarDetective: {
              prompt: 'Детектив ошибки: найдите строку, где возникла ошибка в 6 единиц:',
              derivationChain: [
                {
                  stepLabel: 'Исходное уравнение',
                  expression: '5x - 3 = 2(x + 6)',
                  isBrokenTransition: false,
                  hint: 'Исходное условие задачи.',
                },
                {
                  stepLabel: 'Переход к Шагу 1',
                  expression: '5x - 3 = 2x + 6',
                  isBrokenTransition: true,
                  hint: 'Именно здесь! При раскрытии 2(x + 6) забыли умножить 6 на 2 (должно быть 2x + 12).',
                },
                {
                  stepLabel: 'Переход к Шагу 2*',
                  expression: '3x = 9',
                  isBrokenTransition: false,
                  hint: 'Для уравнения 5x - 3 = 2x + 6 перенос выполнен верно.',
                },
              ],
              finalFixSummary:
                'Раскрыв скобки верно (5x - 3 = 2x + 12), получаем 3x = 15 → x = 5. Проверка: 5·5 - 3 = 22 и 2(5 + 6) = 22 (22 = 22!).',
            },
          },
        },
      },
      {
        stepNumber: 2,
        title: 'Шаг 2. Перенос слагаемых и приведение подобных',
        subtitle: 'Соберите слагаемые с x в левой части, а числа — в правой, меняя знаки при переносе',
        goalDescription: 'Преобразуйте уравнение 5x - 3 = 2x + 12 к виду ax = b',
        inputEquation: '5x - 3 = 2x + 12',
        targetEquation: '3x = 15',
        acceptableNormalizedInputs: ['3x=15', '3*x=15', '5x-2x=12+3'],
        ruleHint: 'Переносим 2x влево со знаком минус (5x - 2x = 3x), а -3 вправо со знаком плюс (12 + 3 = 15).',
        options: [
          {
            id: 's2-2-correct',
            expression: '3x = 15',
            actionLabel: '5x - 2x = 3x слева и 12 + 3 = 15 справа',
            isCorrect: true,
          },
          {
            id: 's2-2-err',
            expression: '3x = 9',
            actionLabel: '5x - 2x = 3x слева и 12 - 3 = 9 справа',
            isCorrect: false,
            errorType: 'transfer_sign',
            errorTitle: 'Не поменяли знак у -3 при переносе в правую часть',
            diagnosticSummary: 'Слагаемое -3 при переходе из левой части в правую меняет минус на плюс: 12 + 3 = 15.',
          },
        ],
        remediationsA: {
          's2-2-err': {
            substepId: '2.1',
            title: 'Подшаг 2.1. Смена знака при переходе через границу «=»',
            ruleName: 'Правило переноса: -3 переходит вправо как +3',
            brokenExpression: '3x = 12 - 3  (3x = 9)',
            correctExpression: '3x = 12 + 3  (3x = 15)',
            visualExplanation:
              'Знак «=» — это граница уравнения. При переносе -3 через границу знак меняется на противоположный (+3), поэтому справа 12 + 3 = 15.',
            highlightBadToken: '12 - 3',
            highlightGoodToken: '12 + 3',
            microQuestion: {
              prompt: 'Мини-тренажёр: перенесите слагаемые в 4x - 5 = x + 10',
              expressionToTransform: '4x - 5 = x + 10',
              options: [
                {
                  id: 'mqs22-1',
                  text: '3x = 15',
                  isCorrect: true,
                  feedback: 'Отлично! 4x - x = 3x и 10 + 5 = 15.',
                },
                {
                  id: 'mqs22-2',
                  text: '3x = 5',
                  isCorrect: false,
                  feedback: 'При переносе -5 вправо знак меняется на +5 (10 + 5 = 15).',
                },
              ],
            },
          },
        },
        consequencesB: {
          's2-2-err': {
            branchId: 'b2-s2-err',
            originStepNumber: 2,
            flawedEquationAtOrigin: '3x = 9',
            errorTitle: 'Потеря смены знака при переносе -3 вправо (12 - 3 = 9)',
            step3Star: {
              prompt: 'Найдите корень x из полученного вами уравнения 3x = 9:',
              currentEquation: '3x = 9',
              options: [
                {
                  id: 'b2s2-3-1',
                  expression: 'x = 3',
                  actionLabel: 'Разделить 9 на 3 (x = 3)',
                  isCorrectForBranch: true,
                },
              ],
              derivedRoot: 3,
              derivedRootExpression: 'x = 3',
              explanation: 'Из 3x = 9 следует кандидат в корни x = 3.',
            },
            step4StarCheck: {
              originalEquation: '5x - 3 = 2(x + 6)',
              substitutedExpressionLeft: 'ЛЧ: 5·3 - 3 = 12 | ПЧ: 2(3 + 6) = 18',
              substitutedValueLeft: 12,
              expectedValueRight: 18,
              verificationPrompt:
                'Подставим x = 3 в исходное уравнение: слева 12, справа 18 (12 ≠ 18). Что показывает эта проверка?',
              options: [
                {
                  id: 'b2v2-1',
                  text: 'Корень x = 3 не подходит к исходному уравнению — при переносе слагаемых потерялся знак',
                  isCorrect: true,
                },
                {
                  id: 'b2v2-2',
                  text: 'Проверка необязательна',
                  isCorrect: false,
                },
              ],
            },
            step5StarDetective: {
              prompt: 'Детектив ошибки: укажите шаг, на котором возникло расхождение:',
              derivationChain: [
                {
                  stepLabel: 'Шаг 1 (Верно)',
                  expression: '5x - 3 = 2x + 12',
                  isBrokenTransition: false,
                  hint: 'Скобки раскрыты верно.',
                },
                {
                  stepLabel: 'Переход к Шагу 2',
                  expression: '3x = 9',
                  isBrokenTransition: true,
                  hint: 'Верно найдено! При переносе -3 вправо должно получиться 12 + 3 = 15, а не 9.',
                },
              ],
              finalFixSummary:
                'Исправив правую часть на 12 + 3 = 15, получаем 3x = 15 → x = 5. Проверка: 22 = 22!',
            },
          },
        },
      },
      {
        stepNumber: 3,
        title: 'Шаг 3. Вычисление корня x',
        subtitle: 'Разделите обе части уравнения на коэффициент при x',
        goalDescription: 'Найдите x из уравнения 3x = 15',
        inputEquation: '3x = 15',
        targetEquation: 'x = 5',
        acceptableNormalizedInputs: ['x=5', '5'],
        ruleHint: 'Разделим 15 на 3: x = 15 / 3 = 5.',
        options: [
          {
            id: 's2-3-correct',
            expression: 'x = 5',
            actionLabel: 'Разделить обе части уравнения на 3 (x = 15 : 3)',
            isCorrect: true,
          },
          {
            id: 's2-3-err',
            expression: 'x = 12',
            actionLabel: 'Вычесть 3 из 15 (x = 15 - 3)',
            isCorrect: false,
            errorType: 'transfer_sign',
            errorTitle: 'Замена деления вычитанием коэффициента',
            diagnosticSummary: 'Между 3 и x стоит знак умножения (3 · x = 15), поэтому обратная операция — деление на 3, а не вычитание.',
          },
        ],
        remediationsA: {
          's2-3-err': {
            substepId: '3.1',
            title: 'Подшаг 3.1. Освобождение переменной от множителя',
            ruleName: 'Деление обеих частей на коэффициент a: ax = b ⇔ x = b / a',
            brokenExpression: 'x = 15 - 3 = 12',
            correctExpression: 'x = 15 : 3 = 5',
            visualExplanation: 'Запись 3x означает 3 · x. Чтобы найти неизвестный множитель, нужно произведение 15 разделить на известный множитель 3.',
            highlightBadToken: '15 - 3',
            highlightGoodToken: '15 : 3',
            microQuestion: {
              prompt: 'Мини-тренажёр: найдите x из уравнения 4x = 20',
              expressionToTransform: '4x = 20',
              options: [
                {
                  id: 'mqs23-1',
                  text: 'x = 5',
                  isCorrect: true,
                  feedback: 'Верно! 20 : 4 = 5.',
                },
                {
                  id: 'mqs23-2',
                  text: 'x = 16',
                  isCorrect: false,
                  feedback: 'Нужно делить 20 на 4, а не вычитать 4.',
                },
              ],
            },
          },
        },
        consequencesB: {
          's2-3-err': {
            branchId: 'b2-s3-err',
            originStepNumber: 2,
            flawedEquationAtOrigin: 'x = 12',
            errorTitle: 'Вычитание коэффициента 3 вместо деления',
            step3Star: {
              prompt: 'Проверим ваш кандидат в корни x = 12 подстановкой:',
              currentEquation: 'x = 12',
              options: [
                {
                  id: 'b2s3-go',
                  expression: 'x = 12',
                  actionLabel: 'Перейти к проверке x = 12 в исходном уравнении',
                  isCorrectForBranch: true,
                },
              ],
              derivedRoot: 12,
              derivedRootExpression: 'x = 12',
              explanation: 'Испытаем x = 12 на алгебраических весах.',
            },
            step4StarCheck: {
              originalEquation: '5x - 3 = 2(x + 6)',
              substitutedExpressionLeft: 'ЛЧ: 5·12 - 3 = 57 | ПЧ: 2(12 + 6) = 36',
              substitutedValueLeft: 57,
              expectedValueRight: 36,
              verificationPrompt: 'При x = 12 слева 57, а справа 36 (57 ≠ 36). Что это значит?',
              options: [
                {
                  id: 'b2v3-1',
                  text: '57 ≠ 36 — вместо вычитания тройки на финальном шаге нужно было разделить 15 на 3',
                  isCorrect: true,
                },
              ],
            },
            step5StarDetective: {
              prompt: 'Детектив ошибки: отметьте неверный переход:',
              derivationChain: [
                {
                  stepLabel: 'Шаг 2 (Верно)',
                  expression: '3x = 15',
                  isBrokenTransition: false,
                  hint: 'Уравнение 3x = 15 верное.',
                },
                {
                  stepLabel: 'Переход к Шагу 3',
                  expression: 'x = 15 - 3 = 12',
                  isBrokenTransition: true,
                  hint: 'Найдено! Нужно делить 15 на 3, получая x = 5.',
                },
              ],
              finalFixSummary: 'Разделив 15 на 3, получаем x = 5. Проверка: 5·5 - 3 = 22 и 2(5 + 6) = 22!',
            },
          },
        },
      },
    ],
  },
];
