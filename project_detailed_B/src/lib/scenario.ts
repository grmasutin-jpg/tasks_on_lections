/**
 * Учебный сценарий: уравнение 2(x + 3) = 14, основные этапы и дополнительные модули.
 */

export const EQUATION = '2(x + 3) = 14';
/** Корень уравнения */
export const ROOT = 4;
/** Намеренно ошибочный ответ на этапе 2 (симуляция) */
export const SIM_WRONG_ANSWER = '2x = 20';

/** Правило, которое проверяет этап */
export type RuleId = 'distributive' | 'inverse' | 'division' | 'check';
/** Правила, для которых есть дополнительный обучающий модуль */
export type RemedialId = 'distributive' | 'inverse' | 'division';

export interface MainStep {
  id: 'expand' | 'subtract' | 'divide' | 'check';
  title: string;
  instruction: string;
  /** эталонный ответ */
  expected: string;
  /** eq — проверка равенства, check — проверка подстановки */
  kind: 'eq' | 'check';
  rule: RuleId;
  hint: string;
}

export const MAIN_STEPS: MainStep[] = [
  {
    id: 'expand',
    title: 'Раскрыть скобки',
    instruction: 'Раскройте скобки в левой части уравнения 2(x + 3) = 14.',
    expected: '2x + 6 = 14',
    kind: 'eq',
    rule: 'distributive',
    hint: 'Умножьте 2 на каждое слагаемое в скобках: 2 · x = 2x и 2 · 3 = 6.',
  },
  {
    id: 'subtract',
    title: 'Вычесть 6 из обеих частей',
    instruction: 'Вычтите 6 из обеих частей уравнения 2x + 6 = 14.',
    expected: '2x = 8',
    kind: 'eq',
    rule: 'inverse',
    hint: 'Вычтите 6 из обеих частей: слева останется 2x, справа 14 − 6 = 8.',
  },
  {
    id: 'divide',
    title: 'Разделить обе части на 2',
    instruction: 'Разделите обе части уравнения 2x = 8 на 2.',
    expected: 'x = 4',
    kind: 'eq',
    rule: 'division',
    hint: 'Разделите каждую часть на 2: 2x ÷ 2 = x, 8 ÷ 2 = 4.',
  },
  {
    id: 'check',
    title: 'Проверка подстановкой',
    instruction: 'Подставьте x = 4 в исходное уравнение 2(x + 3) = 14.',
    expected: '2(4 + 3) = 14',
    kind: 'check',
    rule: 'check',
    hint: 'Сначала вычислите 4 + 3 = 7, затем 2 · 7 = 14 и сравните с правой частью 14.',
  },
];

/** Текущее состояние уравнения перед каждым основным этапом */
export const STATES = ['2(x + 3) = 14', '2x + 6 = 14', '2x = 8', 'x = 4'];

export interface RemedialTask {
  /** num — число, expr — выражение, eq — равенство */
  kind: 'num' | 'expr' | 'eq';
  prompt: string;
  expected: string;
  hint: string;
  example: string;
}

export interface RemedialModule {
  id: RemedialId;
  title: string;
  shortTitle: string;
  ruleLabel: string;
  explanation: string[];
  tasks: RemedialTask[];
}

export const REMEDIAL: Record<RemedialId, RemedialModule> = {
  inverse: {
    id: 'inverse',
    title: 'Обратные действия: сложение и вычитание',
    shortTitle: 'Обратные действия',
    ruleLabel: 'обратные арифметические действия (сложение и вычитание)',
    explanation: [
      'Сложение и вычитание — обратные действия: «+6» убирается вычитанием «−6».',
      'Чтобы перенести +6 из левой части, вычтите 6 из обеих частей уравнения.',
      'Одно и то же число вычитаем из левой и правой частей, иначе равенство нарушится.',
      'Ошибка 2x = 20 означает, что 6 прибавили вместо вычитания: 14 + 6 = 20, а нужно 14 − 6 = 8.',
    ],
    tasks: [
      {
        kind: 'num',
        prompt: 'В уравнении x + 6 = 14 чтобы убрать +6 слева, какое число нужно вычесть из обеих частей? Введите число.',
        expected: '6',
        hint: 'Обратное к сложению — вычитание. Вычитаем то же число, что прибавлено: 6.',
        example: 'x + 6 − 6 = 14 − 6, значит x = 8. Вычитали 6.',
      },
      {
        kind: 'eq',
        prompt: 'Решите x + 4 = 9, вычитая 4 из обеих частей. Запишите результат в виде равенства.',
        expected: 'x = 5',
        hint: 'Вычтите 4 из обеих частей: слева останется x, справа 9 − 4.',
        example: 'x + 4 − 4 = 9 − 4, значит x = 5.',
      },
    ],
  },
  distributive: {
    id: 'distributive',
    title: 'Раскрытие скобок',
    shortTitle: 'Раскрытие скобок',
    ruleLabel: 'раскрытие скобок (умножение на каждое слагаемое)',
    explanation: [
      'Множитель перед скобкой умножается на каждое слагаемое внутри неё: a(b + c) = ab + ac.',
      'В 2(x + 3) множитель 2 умножаем и на x, и на 3: получаем 2x + 6.',
      'Частая ошибка — умножить только первое слагаемое.',
    ],
    tasks: [
      {
        kind: 'expr',
        prompt: 'Раскройте скобки: 3(x + 2)',
        expected: '3x + 6',
        hint: '3 · x = 3x и 3 · 2 = 6.',
        example: '3(x + 2) = 3x + 6.',
      },
      {
        kind: 'expr',
        prompt: 'Раскройте скобки: −2(x − 4)',
        expected: '-2x + 8',
        hint: 'Не забудьте знак: −2 · (−4) = +8.',
        example: '−2(x − 4) = −2x + 8.',
      },
    ],
  },
  division: {
    id: 'division',
    title: 'Деление обеих частей',
    shortTitle: 'Деление',
    ruleLabel: 'деление обеих частей на коэффициент при x',
    explanation: [
      'Чтобы найти x, разделите обе части уравнения на коэффициент при x.',
      'Для 2x = 8 делим обе части на 2: получаем x = 4.',
      'Правую часть тоже делим: 8 ÷ 2 = 4.',
    ],
    tasks: [
      {
        kind: 'eq',
        prompt: 'Решите 4x = 20, разделив обе части на 4.',
        expected: 'x = 5',
        hint: 'Разделите 20 на 4, а левую часть 4x — на 4.',
        example: '4x ÷ 4 = 20 ÷ 4, значит x = 5.',
      },
      {
        kind: 'eq',
        prompt: 'Решите 6x = 18.',
        expected: 'x = 3',
        hint: 'Разделите обе части на 6.',
        example: '6x ÷ 6 = 18 ÷ 6, значит x = 3.',
      },
    ],
  },
};

/** Какой дополнительный модуль соответствует правилу (null — дополнительного этапа нет) */
export function remedialFor(rule: RuleId): RemedialId | null {
  return rule === 'check' ? null : rule;
}
