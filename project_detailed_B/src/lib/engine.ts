/**
 * Движок обучения. Чистые функции: состояние прохождения + ответ ученика → новое состояние.
 * Один и тот же движок используется и в интерактивном режиме, и в автоматическом прогоне сравнения.
 */
import {
  MathInputError,
  formatNumber,
  isClose,
  normalizeInput,
  parseEquation,
  parseExpression,
  sameEquation,
  sameLin,
  type Equation,
} from './math';
import {
  MAIN_STEPS,
  REMEDIAL,
  ROOT,
  SIM_WRONG_ANSWER,
  remedialFor,
  type MainStep,
  type RemedialId,
  type RemedialTask,
} from './scenario';

export type Strategy = 'A' | 'B';
export type Phase = 'main' | 'remedial' | 'done';
export type EventType =
  | 'start'
  | 'ok'
  | 'error'
  | 'hint'
  | 'sim'
  | 'remedial_enter'
  | 'remedial_ok'
  | 'remedial_error'
  | 'return'
  | 'complete';
export type Tone = 'success' | 'error' | 'warning' | 'info';

export interface RouteEvent {
  type: EventType;
  label: string;
  text: string;
}

export interface Feedback {
  tone: Tone;
  title: string;
  message: string;
  hint?: string;
}

export interface RunState {
  id: string;
  strategy: Strategy;
  simulate: boolean;
  phase: Phase;
  /** индекс текущего основного этапа (0..3) */
  stepIndex: number;
  /** неверных попыток на текущем основном этапе */
  attempts: number;
  /** id основных этапов, которые засчитаны (каждый — один раз) */
  completed: string[];
  /** найденный корень (x) */
  solution: number | null;
  /** всего неверных ответов (основные этапы + дополнительные задания) */
  errors: number;
  /** правильных ответов на основных этапах */
  mainCorrect: number;
  /** правильных ответов на дополнительных заданиях */
  remedialCorrect: number;
  /** сколько раз открывался дополнительный этап */
  remedialEntries: number;
  remedialModule: RemedialId | null;
  remedialIndex: number;
  remedialAttempts: number;
  /** модули, которые пройдены и закрыты */
  remedialDone: RemedialId[];
  /** симуляция ошибки уже применена к этапу 2 */
  simDone: boolean;
  route: RouteEvent[];
  feedback: Feedback | null;
  startedAt: number;
  finishedAt: number | null;
}

export interface RunSummary {
  strategy: Strategy;
  simulate: boolean;
  completed: boolean;
  passedSteps: string[];
  totalSteps: number;
  currentStage: string;
  errors: number;
  correctAnswers: number;
  remedialModules: number;
  remedialTasksDone: number;
  statusLabel: string;
  routeLabels: string[];
}

export const STRATEGY_NAMES: Record<Strategy, string> = {
  A: 'Последовательное обучение',
  B: 'Адаптивное обучение',
};

interface Verdict {
  ok: boolean;
  diagnosis: string;
  solution?: number;
}

export function createRun(strategy: Strategy, simulate: boolean, now: number = Date.now()): RunState {
  return {
    id: `${strategy}-${now}-${Math.floor(Math.random() * 1e6)}`,
    strategy,
    simulate,
    phase: 'main',
    stepIndex: 0,
    attempts: 0,
    completed: [],
    solution: null,
    errors: 0,
    mainCorrect: 0,
    remedialCorrect: 0,
    remedialEntries: 0,
    remedialModule: null,
    remedialIndex: 0,
    remedialAttempts: 0,
    remedialDone: [],
    simDone: false,
    route: [
      {
        type: 'start',
        label: 'Старт',
        text: `${STRATEGY_NAMES[strategy]}. Симуляция ошибки: ${simulate ? 'включена' : 'выключена'}.`,
      },
    ],
    feedback: null,
    startedAt: now,
    finishedAt: null,
  };
}

/** Какое задание сейчас показано ученику (без счётчика попыток) */
export function turnKey(s: RunState): string {
  if (s.phase === 'done') return 'done';
  if (s.phase === 'main') return `main:${MAIN_STEPS[s.stepIndex].id}`;
  return `rem:${s.remedialModule}:${s.remedialEntries}:${s.remedialIndex}`;
}

/** Ключ отправки: защищает от повторного засчитывания (двойной клик) */
export function submitKey(s: RunState): string {
  const attempts = s.phase === 'remedial' ? s.remedialAttempts : s.attempts;
  return `${turnKey(s)}#${attempts}`;
}

export function currentRemedialTask(s: RunState): RemedialTask | undefined {
  return s.remedialModule ? REMEDIAL[s.remedialModule].tasks[s.remedialIndex] : undefined;
}

/** Симуляция: текущий ход — этап 2 и симуляция ещё не использована */
export function isSimulatedTurn(s: RunState): boolean {
  return s.simulate && !s.simDone && s.phase === 'main' && MAIN_STEPS[s.stepIndex].id === 'subtract';
}

function withFeedback(state: RunState, feedback: Feedback): RunState {
  return { ...state, feedback };
}

export function submitAnswer(state: RunState, raw: string, key?: string): RunState {
  if (state.phase === 'done') {
    return withFeedback(state, {
      tone: 'info',
      title: 'Маршрут уже пройден',
      message: 'Все этапы выполнены. Нажмите «Пройти заново», чтобы начать сначала.',
    });
  }
  if (key !== undefined && key !== submitKey(state)) {
    return withFeedback(state, {
      tone: 'info',
      title: 'Двойное нажатие',
      message: 'Этот ответ уже был отправлен и засчитан один раз. Повторной проверки не будет.',
    });
  }
  return state.phase === 'main' ? submitMain(state, raw) : submitRemedial(state, raw);
}

function diagnoseEquation(stepId: string, eq: Equation): string {
  if (stepId === 'expand') {
    if (!isClose(eq.lhs.a, 2)) return 'Коэффициент при x должен остаться 2: умножьте 2 на x.';
    if (!isClose(eq.lhs.b, 6)) return 'Умножьте 2 и на x, и на 3: 2 · 3 = 6.';
    return 'Правая часть уравнения остаётся 14.';
  }
  if (stepId === 'subtract') {
    if (isClose(eq.rhs.b, 20)) {
      return 'Вы прибавили 6 вместо того, чтобы вычесть: 14 + 6 = 20, а нужно 14 − 6 = 8.';
    }
    if (!isClose(eq.lhs.a, 2)) return 'Слева должно остаться 2x.';
    return 'Вычитаем 6 из обеих частей: справа 14 − 6 = 8.';
  }
  if (stepId === 'divide') {
    if (isClose(eq.lhs.a, 1) && isClose(eq.rhs.b, 8)) return 'Правую часть не разделили: 8 ÷ 2 = 4.';
    if (isClose(eq.lhs.a, 2)) return 'Левую часть тоже нужно разделить на 2: 2x ÷ 2 = x.';
    return 'Разделите обе части на 2: x = 8 ÷ 2.';
  }
  return 'Ответ не совпадает с правильным.';
}

function checkSubstitution(raw: string, x: number): Verdict {
  const eq = parseEquation(raw);
  if (!isClose(eq.lhs.a, 0) || !isClose(eq.rhs.a, 0)) {
    throw new MathInputError(`В проверке не должно остаться x. Подставьте значение x = ${x}, например: 2(${x} + 3) = 14.`);
  }
  if (!eq.literals.some((v) => isClose(v, x))) {
    return {
      ok: false,
      diagnosis: `В записи нет числа ${x}. Замените x на ${x}: 2(${x} + 3) = 14.`,
    };
  }
  const left = eq.lhs.b;
  const right = eq.rhs.b;
  if (isClose(left, right)) {
    return { ok: true, diagnosis: 'Подстановка верна: левая и правая части равны.' };
  }
  return {
    ok: false,
    diagnosis: `Левая часть равна ${formatNumber(left)}, а правая ${formatNumber(right)}. Проверьте вычисления: ${x} + 3 = ${x + 3}, затем 2 · ${x + 3} = ${2 * (x + 3)}.`,
  };
}

function checkMain(step: MainStep, raw: string, solution: number | null): Verdict {
  if (step.kind === 'check') return checkSubstitution(raw, solution ?? ROOT);
  const eq = parseEquation(raw);
  const exp = parseEquation(step.expected);
  if (sameEquation(eq, exp)) {
    return { ok: true, diagnosis: 'Верно.', solution: step.id === 'divide' ? exp.rhs.b : undefined };
  }
  return { ok: false, diagnosis: diagnoseEquation(step.id, eq) };
}

function submitMain(state: RunState, raw: string): RunState {
  const step = MAIN_STEPS[state.stepIndex];
  const n = state.stepIndex + 1;

  let verdict: Verdict;
  try {
    verdict = checkMain(step, raw, state.solution);
  } catch (e) {
    if (e instanceof MathInputError) {
      return withFeedback(state, { tone: 'warning', title: 'Ответ не принят', message: e.message });
    }
    throw e;
  }

  const s: RunState = { ...state };

  if (isSimulatedTurn(state)) {
    s.simDone = true;
    if (normalizeInput(raw) === normalizeInput(SIM_WRONG_ANSWER)) {
      s.route = [
        ...s.route,
        {
          type: 'sim',
          label: 'Симуляция',
          text: `Симуляция ошибки на этапе ${n}: введён ответ «${SIM_WRONG_ANSWER}» (вместо вычитания прибавили 6).`,
        },
      ];
    }
  }

  if (verdict.ok) {
    if (!s.completed.includes(step.id)) {
      s.completed = [...s.completed, step.id];
      s.mainCorrect += 1;
    }
    if (verdict.solution !== undefined) s.solution = verdict.solution;
    s.attempts = 0;
    s.route = [
      ...s.route,
      { type: 'ok', label: `${n} ✓`, text: `Этап ${n} «${step.title}»: «${raw.trim()}» — верно.` },
    ];

    if (s.stepIndex < MAIN_STEPS.length - 1) {
      s.stepIndex += 1;
      const next = MAIN_STEPS[s.stepIndex];
      return withFeedback(s, {
        tone: 'success',
        title: 'Верно!',
        message: `Этап ${n} пройден. Следующий этап ${s.stepIndex + 1}: «${next.title}».`,
      });
    }

    s.phase = 'done';
    s.finishedAt = Date.now();
    s.route = [
      ...s.route,
      { type: 'complete', label: 'Готово', text: `Уравнение решено: x = ${ROOT}. Все этапы пройдены.` },
    ];
    return withFeedback(s, {
      tone: 'success',
      title: 'Уравнение решено!',
      message: `x = ${ROOT}. Проверка подстановкой подтвердила ответ.`,
    });
  }

  // ---- неверный ответ ----
  s.errors += 1;
  s.attempts += 1;
  s.route = [
    ...s.route,
    {
      type: 'error',
      label: `${n} ✗`,
      text: `Этап ${n}: «${raw.trim()}» — неверно. ${verdict.diagnosis}`,
    },
  ];

  const modId = remedialFor(step.rule);
  if (state.strategy === 'B' && modId) {
    // Стратегия B: определяем правило и переходим на дополнительный этап
    const mod = REMEDIAL[modId];
    s.phase = 'remedial';
    s.remedialModule = modId;
    s.remedialIndex = 0;
    s.remedialAttempts = 0;
    s.remedialEntries += 1;
    s.route = [
      ...s.route,
      {
        type: 'remedial_enter',
        label: `Доп. «${mod.shortTitle}»`,
        text: `Определён пробел: ${mod.ruleLabel}. Вместо повтора открыт дополнительный этап.`,
      },
    ];
    return withFeedback(s, {
      tone: 'warning',
      title: 'Обнаружен пробел в правиле',
      message: `${verdict.diagnosis} Система определила, что нужно отработать: ${mod.ruleLabel}. Сначала короткое объяснение и 2 задания, затем вы вернётесь к этапу ${n}.`,
    });
  }

  // Стратегия A (или этап без дополнительного модуля): подсказка и повтор того же этапа
  s.route = [...s.route, { type: 'hint', label: 'Подсказка', text: step.hint }];
  const tail = s.attempts >= 3 ? ' Вы ошиблись уже несколько раз — внимательно перечитайте подсказку.' : '';
  return withFeedback(s, {
    tone: 'error',
    title: 'Неверно',
    message: `${verdict.diagnosis} Вы остаётесь на этапе ${n}, попробуйте ещё раз.${tail}`,
    hint: step.hint,
  });
}

function checkTask(task: RemedialTask, raw: string): boolean {
  if (task.kind === 'num') {
    const e = parseExpression(raw);
    return isClose(e.a, 0) && isClose(e.b, Number(task.expected));
  }
  if (task.kind === 'expr') return sameLin(parseExpression(raw), parseExpression(task.expected));
  return sameEquation(parseEquation(raw), parseEquation(task.expected));
}

function submitRemedial(state: RunState, raw: string): RunState {
  const modId = state.remedialModule;
  if (!modId) return state;
  const mod = REMEDIAL[modId];
  const task = mod.tasks[state.remedialIndex];

  let ok: boolean;
  try {
    ok = checkTask(task, raw);
  } catch (e) {
    if (e instanceof MathInputError) {
      return withFeedback(state, { tone: 'warning', title: 'Ответ не принят', message: e.message });
    }
    throw e;
  }

  const num = state.remedialIndex + 1;
  const s: RunState = { ...state };

  if (ok) {
    s.remedialCorrect += 1;
    s.remedialAttempts = 0;
    s.remedialIndex += 1;
    s.route = [
      ...s.route,
      {
        type: 'remedial_ok',
        label: 'Доп. ✓',
        text: `Задание ${num} из ${mod.tasks.length} выполнено верно: «${raw.trim()}».`,
      },
    ];

    if (s.remedialIndex < mod.tasks.length) {
      return withFeedback(s, {
        tone: 'success',
        title: 'Верно!',
        message: `Задание ${num} выполнено. Переходим к заданию ${num + 1}.`,
      });
    }

    // Все задания модуля выполнены — возвращаемся к исходной задаче
    const mainStep = MAIN_STEPS[s.stepIndex];
    s.phase = 'main';
    s.remedialModule = null;
    s.remedialIndex = 0;
    s.remedialDone = [...s.remedialDone, modId];
    s.route = [
      ...s.route,
      {
        type: 'return',
        label: `↩ к этапу ${s.stepIndex + 1}`,
        text: `Дополнительный этап пройден. Возврат к основному заданию: «${mainStep.title}».`,
      },
    ];
    return withFeedback(s, {
      tone: 'success',
      title: 'Дополнительный этап пройден',
      message: `Правило «${mod.shortTitle}» отработано. Возвращаемся к этапу ${s.stepIndex + 1}: ${mainStep.instruction}`,
    });
  }

  s.errors += 1;
  s.remedialAttempts += 1;
  s.route = [
    ...s.route,
    { type: 'remedial_error', label: 'Доп. ✗', text: `Задание ${num}: «${raw.trim()}» — неверно.` },
  ];
  return withFeedback(s, {
    tone: 'error',
    title: 'Задание выполнено неверно',
    message: 'Перечитайте объяснение и попробуйте ещё раз. Этап не засчитан, вы остаётесь в дополнительном этапе.',
    hint: s.remedialAttempts >= 2 ? `${task.hint} Пример: ${task.example}` : task.hint,
  });
}

/** Сводка прохождения для таблиц и сравнения */
export function summarize(s: RunState): RunSummary {
  const done = s.phase === 'done';
  let currentStage: string;
  if (done) currentStage = 'Все этапы пройдены';
  else if (s.phase === 'remedial' && s.remedialModule) currentStage = `Доп. этап: ${REMEDIAL[s.remedialModule].title}`;
  else currentStage = `${s.stepIndex + 1}. ${MAIN_STEPS[s.stepIndex].title}`;

  const statusLabel = done
    ? s.errors === 0
      ? 'Пройден без ошибок'
      : `Пройден, ошибок: ${s.errors}`
    : `В процессе: этап ${s.stepIndex + 1} из ${MAIN_STEPS.length}`;

  return {
    strategy: s.strategy,
    simulate: s.simulate,
    completed: done,
    passedSteps: MAIN_STEPS.filter((st) => s.completed.includes(st.id)).map((st) => st.title),
    totalSteps: MAIN_STEPS.length,
    currentStage,
    errors: s.errors,
    correctAnswers: s.mainCorrect + s.remedialCorrect,
    remedialModules: s.remedialEntries,
    remedialTasksDone: s.remedialCorrect,
    statusLabel,
    routeLabels: s.route.map((e) => e.label),
  };
}

/** Ответ «идеального» ученика по сценарию (с симуляцией — ошибка на этапе 2) */
export function answerFor(s: RunState): string {
  if (s.phase === 'done') return '';
  if (s.phase === 'main') {
    if (isSimulatedTurn(s)) return SIM_WRONG_ANSWER;
    return MAIN_STEPS[s.stepIndex].expected;
  }
  return currentRemedialTask(s)?.expected ?? '';
}

/** Автоматический прогон: те же правила, те же данные, тот же движок */
export function autoRun(strategy: Strategy, simulate: boolean): RunState {
  let s = createRun(strategy, simulate);
  let guard = 0;
  while (s.phase !== 'done' && guard < 60) {
    s = submitAnswer(s, answerFor(s), submitKey(s));
    guard += 1;
  }
  return s;
}
