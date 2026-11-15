// MathPath — ядро учебной логики
// Реальная проверка ответов, маршрутизация стратегий A/B, статистика.

export type Strategy = "A" | "B";
export type StageId = 1 | 2 | 3 | 4 | "R";
export type RunStatus = "in-progress" | "completed";

export interface StageDef {
  id: StageId;
  num: string;
  title: string;
  rule: string;
  before: string;
  after: string;
  prompt: string;
  expected: number;
  hint: string;
  explain: string;
  simulatedError?: number;
}

export const EQUATION = "2(x + 3) = 14";

export const STAGES: StageDef[] = [
  {
    id: 1,
    num: "Этап 1",
    title: "Раскрыть скобки",
    rule: "Правило: a·(b + c) = a·b + a·c. Умножаем 2 на каждое слагаемое в скобках.",
    before: "2(x + 3) = 14",
    after: "2x + 6 = 14",
    prompt: "2x + ? = 14 — какое число стоит вместо знака вопроса?",
    expected: 6,
    hint: "Подсказка: 2 · 3 = 6. Коэффициент 2 умножается и на x, и на 3.",
    explain: "Раскрываем скобки: 2·x = 2x и 2·3 = 6. Получаем 2x + 6 = 14.",
  },
  {
    id: 2,
    num: "Этап 2",
    title: "Вычесть 6 из обеих частей",
    rule: "Правило: чтобы убрать +6 слева, вычитаем 6 из обеих частей уравнения.",
    before: "2x + 6 = 14",
    after: "2x = 8",
    prompt: "2x = ? — чему равна правая часть после вычитания 6?",
    expected: 8,
    hint: "Подсказка: нужно вычесть 6 из обеих частей: 14 − 6 = 8.",
    explain: "Вычитаем 6 из обеих частей: 14 − 6 = 8. Получаем 2x = 8.",
    simulatedError: 20,
  },
  {
    id: 3,
    num: "Этап 3",
    title: "Разделить обе части на 2",
    rule: "Правило: чтобы найти x, делим обе части на коэффициент 2.",
    before: "2x = 8",
    after: "x = 4",
    prompt: "x = ? — чему равен x после деления на 2?",
    expected: 4,
    hint: "Подсказка: 8 : 2 = 4.",
    explain: "Делим обе части на 2: 8 : 2 = 4. Ответ: x = 4.",
  },
  {
    id: 4,
    num: "Этап 4",
    title: "Проверить ответ подстановкой",
    rule: "Правило: подставляем x = 4 в исходное уравнение и проверяем равенство.",
    before: "2(4 + 3) = ?",
    after: "2 · 7 = 14 ✓",
    prompt: "2(4 + 3) = ? — чему равна левая часть?",
    expected: 14,
    hint: "Подсказка: сначала 4 + 3 = 7, затем 2 · 7 = 14.",
    explain: "2(4 + 3) = 2 · 7 = 14. Левая часть равна правой — ответ верный!",
  },
];

export const REMEDIAL: StageDef = {
  id: "R",
  num: "Доп. этап",
  title: "Обратные действия",
  rule: "Правило: сложение и вычитание — обратные действия. Если слева +6, то справа нужно −6.",
  before: "2x + 6 = 14  →  2x = 14 − 6",
  after: "14 − 6 = 8",
  prompt: "Вычисли: 14 − 6 = ?",
  expected: 8,
  hint: "Подсказка: 14 − 6 = 8. Вычитаем 6 из обеих частей, а не прибавляем!",
  explain:
    "Ошибка 20 = 14 + 6 означает, что вместо вычитания было выполнено сложение. Обратное действие к «+6» — это «−6». Поэтому 2x = 14 − 6 = 8.",
};

export function getStage(id: StageId): StageDef {
  if (id === "R") return REMEDIAL;
  return STAGES.find((s) => s.id === id)!;
}

export type ParseResult =
  | { kind: "empty" }
  | { kind: "not-number" }
  | { kind: "number"; value: number };

export function parseAnswer(raw: string): ParseResult {
  const t = raw.trim().replace(",", ".");
  if (t === "") return { kind: "empty" };
  // Разрешаем только числа (с минусом и точкой), всё остальное — не число
  if (!/^-?\d+(\.\d+)?$/.test(t)) return { kind: "not-number" };
  const v = Number(t);
  if (!Number.isFinite(v)) return { kind: "not-number" };
  return { kind: "number", value: v };
}

export type CheckResult =
  | { kind: "empty"; message: string }
  | { kind: "not-number"; message: string }
  | { kind: "correct"; value: number; message: string }
  | { kind: "wrong"; value: number; message: string };

export function checkAnswer(stage: StageDef, raw: string): CheckResult {
  const p = parseAnswer(raw);
  if (p.kind === "empty")
    return { kind: "empty", message: "Поле пустое. Введите число, чтобы проверить этап." };
  if (p.kind === "not-number")
    return {
      kind: "not-number",
      message: "Нужно ввести число, а не буквы или символы. Попробуйте ещё раз.",
    };
  if (p.value === stage.expected)
    return { kind: "correct", value: p.value, message: "Верно! " + stage.explain };
  return {
    kind: "wrong",
    value: p.value,
    message: `Неверно: введено ${p.value}, а правильный ответ — ${stage.expected}.`,
  };
}

// ---------- Маршрут / запуск ----------

export interface RouteEvent {
  id: number;
  stage: StageId;
  kind: "correct" | "error" | "remedial-enter" | "remedial-exit" | "info";
  value?: number;
  message: string;
}

export interface RunState {
  strategy: Strategy;
  simulateError: boolean;
  current: StageId;
  completed: StageId[];
  errors: number;
  extraTasks: number;
  correctCount: number;
  attempts: number;
  status: RunStatus;
  route: RouteEvent[];
  remedialReturnTo: StageId | null;
  startedAt: number;
  finishedAt: number | null;
}

let eventSeq = 1;
export function newRun(strategy: Strategy, simulateError: boolean): RunState {
  eventSeq = 1;
  return {
    strategy,
    simulateError,
    current: 1,
    completed: [],
    errors: 0,
    extraTasks: 0,
    correctCount: 0,
    attempts: 0,
    status: "in-progress",
    route: [
      {
        id: eventSeq++,
        stage: 1,
        kind: "info",
        message: `Старт стратегии ${strategy === "A" ? "A (последовательная)" : "B (адаптивная)"}. Уравнение: ${EQUATION}. Симуляция ошибки: ${simulateError ? "включена (на этапе 2 будет введено 20)" : "выключена"}.`,
      },
    ],
    remedialReturnTo: null,
    startedAt: Date.now(),
    finishedAt: null,
  };
}

export interface StepOutcome {
  run: RunState;
  feedback: string;
  feedbackKind: "success" | "error" | "warn" | "info";
  hint?: string;
  moved: string;
}

/** Обработка одного нажатия «Проверить». Чистая функция: возвращает новый RunState. */
export function applyCheck(run: RunState, rawInput: string): StepOutcome {
  if (run.status === "completed") {
    return { run, feedback: "Запуск уже завершён. Нажмите «Пройти заново».", feedbackKind: "info", moved: "—" };
  }
  const stage = getStage(run.current);
  const res = checkAnswer(stage, rawInput);

  const next: RunState = {
    ...run,
    completed: [...run.completed],
    route: [...run.route],
    attempts: run.attempts + 1,
  };

  if (res.kind === "empty" || res.kind === "not-number") {
    // Форматная ошибка: не считается математической ошибкой, маршрут не меняется
    next.route.push({ id: eventSeq++, stage: run.current, kind: "info", message: res.message });
    return { run: next, feedback: res.message, feedbackKind: "warn", moved: "Остаёмся на текущем этапе" };
  }

  if (res.kind === "correct") {
    next.correctCount += 1;
    if (!next.completed.includes(run.current)) next.completed.push(run.current);
    next.route.push({
      id: eventSeq++,
      stage: run.current,
      kind: run.current === "R" ? "remedial-exit" : "correct",
      value: res.value,
      message:
        run.current === "R"
          ? `Доп. задание выполнено верно (${res.value}). Возвращаемся к этапу ${next.remedialReturnTo ?? 2}.`
          : `Этап «${stage.title}» выполнен верно: ${res.value}.`,
    });

    if (run.current === "R") {
      const back = next.remedialReturnTo ?? 2;
      next.current = back;
      next.remedialReturnTo = null;
      return {
        run: next,
        feedback: `Дополнительное задание выполнено! Возвращаемся к основному маршруту — этап ${back}.`,
        feedbackKind: "success",
        moved: `Доп. этап → Этап ${back}`,
      };
    }

    const idx = STAGES.findIndex((s) => s.id === run.current);
    if (idx >= 0 && idx < STAGES.length - 1) {
      const nxt = STAGES[idx + 1].id;
      next.current = nxt;
      return { run: next, feedback: res.message, feedbackKind: "success", moved: `Этап ${run.current} → Этап ${nxt}` };
    }
    next.status = "completed";
    next.finishedAt = Date.now();
    next.route.push({ id: eventSeq++, stage: 4, kind: "info", message: "Все этапы пройдены. Ответ: x = 4." });
    return { run: next, feedback: res.message + " Запуск завершён!", feedbackKind: "success", moved: "Финиш" };
  }

  // res.kind === "wrong" — математическая ошибка, маршрутизация зависит от стратегии
  next.errors += 1;
  const isSimulated = run.simulateError && run.current === 2 && res.value === 20;

  if (run.strategy === "A") {
    next.route.push({
      id: eventSeq++,
      stage: run.current,
      kind: "error",
      value: res.value,
      message: `Ошибка на этапе «${stage.title}»: введено ${res.value} вместо ${stage.expected}. Стратегия A: остаёмся на этапе, показываем подсказку.`,
    });
    return {
      run: next,
      feedback: isSimulated
        ? `Симулированная ошибка обнаружена: введено 20 вместо 8. Стратегия A не меняет маршрут — вы остаётесь на этапе 2.`
        : `Неверно. Стратегия A: вы остаётесь на текущем этапе и получаете подсказку.`,
      feedbackKind: "error",
      hint: stage.hint,
      moved: `Этап ${run.current} → Этап ${run.current} (повтор)`,
    };
  }

  // Стратегия B
  if (run.current === "R") {
    next.route.push({
      id: eventSeq++,
      stage: "R",
      kind: "error",
      value: res.value,
      message: `Ошибка в доп. задании: введено ${res.value} вместо ${stage.expected}. Остаёмся на доп. этапе.`,
    });
    return {
      run: next,
      feedback: "В дополнительном задании ошибка. Остаёмся на доп. этапе — прочитайте объяснение ещё раз.",
      feedbackKind: "error",
      hint: stage.hint,
      moved: "Доп. этап → Доп. этап (повтор)",
    };
  }

  // Ошибка на основном этапе в стратегии B → переход на доп. этап
  next.extraTasks += 1;
  next.remedialReturnTo = run.current;
  next.current = "R";
  next.route.push({
    id: eventSeq++,
    stage: run.current,
    kind: "error",
    value: res.value,
    message: `Ошибка на этапе «${stage.title}»: введено ${res.value} вместо ${stage.expected}. Диагностика: не усвоено правило обратных действий.`,
  });
  next.route.push({
    id: eventSeq++,
    stage: "R",
    kind: "remedial-enter",
    message: `Стратегия B: переход на дополнительный обучающий этап «Обратные действия». После успеха вернёмся к этапу ${run.current}.`,
  });
  return {
    run: next,
    feedback: `Обнаружена ошибка: введено ${res.value} вместо ${stage.expected}. Система определила: не усвоено правило обратных действий. Переходим на дополнительный обучающий этап.`,
    feedbackKind: "error",
    hint: REMEDIAL.explain,
    moved: `Этап ${run.current} → Доп. этап`,
  };
}

/** Автоматическая симуляция полного прохождения (для страницы сравнения). Использует ту же логику applyCheck. */
export function simulateRun(strategy: Strategy, simulateError: boolean): RunState {
  let run = newRun(strategy, simulateError);
  const script: Record<string, string> = { "1": "6", "2": simulateError ? "20" : "8", "3": "4", "4": "14", R: "8" };
  let guard = 0;
  while (run.status !== "completed" && guard < 20) {
    guard += 1;
    const key = String(run.current);
    let input = script[key] ?? "8";
    // Симулированная ошибка вводится только один раз: после первой ошибки
    // этап 2 (и доп. этап в стратегии B) проходится верно
    if (run.current === 2 && run.errors > 0) input = "8";
    const out = applyCheck(run, input);
    run = out.run;
    // Если после ошибки в B мы на доп. этапе — следующий шаг выполнит R
  }
  return run;
}

// ---------- Безопасное хранилище ----------

const KEY_RUN = "mathpath:currentRun";
const KEY_HISTORY = "mathpath:history";
const KEY_FLAGS = "mathpath:flags";
const KEY_COMPARE = "mathpath:compare";

let storageOk = true;
let memoryFallback: Record<string, string> = {};

function rawGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    storageOk = false;
    return memoryFallback[key] ?? null;
  }
}
function rawSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    storageOk = false;
    memoryFallback[key] = value;
  }
}
function rawRemove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    delete memoryFallback[key];
  }
}
export function isStorageAvailable(): boolean {
  try {
    const k = "__mathpath_test__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}
export function storageAvailable(): boolean {
  return storageOk;
}

export interface RunRecord {
  strategy: Strategy;
  simulateError: boolean;
  errors: number;
  extraTasks: number;
  correctCount: number;
  attempts: number;
  status: RunStatus;
  routeLength: number;
  date: string;
}

export function saveCurrentRun(run: RunState) {
  rawSet(KEY_RUN, JSON.stringify(run));
}
export function loadCurrentRun(): RunState | null {
  const s = rawGet(KEY_RUN);
  if (!s) return null;
  try {
    const r = JSON.parse(s) as RunState;
    if (typeof r.strategy !== "string" || typeof r.current === "undefined") return null;
    return r;
  } catch {
    return null;
  }
}
export function clearCurrentRun() {
  rawRemove(KEY_RUN);
}
export function pushHistory(rec: RunRecord) {
  const h = loadHistory();
  h.unshift(rec);
  rawSet(KEY_HISTORY, JSON.stringify(h.slice(0, 30)));
}
export function loadHistory(): RunRecord[] {
  const s = rawGet(KEY_HISTORY);
  if (!s) return [];
  try {
    const h = JSON.parse(s);
    return Array.isArray(h) ? h : [];
  } catch {
    return [];
  }
}
export interface Flags {
  aNoSimDone: boolean;
  aSimDone: boolean;
  bSimDone: boolean;
}
export function loadFlags(): Flags {
  const s = rawGet(KEY_FLAGS);
  if (!s) return { aNoSimDone: false, aSimDone: false, bSimDone: false };
  try {
    const parsed = JSON.parse(s) as Partial<Flags>;
    return {
      aNoSimDone: Boolean(parsed.aNoSimDone),
      aSimDone: Boolean(parsed.aSimDone),
      bSimDone: Boolean(parsed.bSimDone),
    };
  } catch {
    return { aNoSimDone: false, aSimDone: false, bSimDone: false };
  }
}
export function saveFlags(f: Flags) {
  rawSet(KEY_FLAGS, JSON.stringify(f));
}
export interface CompareSnapshot {
  a: RunState | null;
  b: RunState | null;
  simulateError: boolean;
}
export function saveCompare(c: CompareSnapshot) {
  rawSet(KEY_COMPARE, JSON.stringify(c));
}
export function loadCompare(): CompareSnapshot | null {
  const s = rawGet(KEY_COMPARE);
  if (!s) return null;
  try {
    return JSON.parse(s) as CompareSnapshot;
  } catch {
    return null;
  }
}

export function progressPercent(run: RunState): number {
  const done = run.completed.filter((c) => c !== "R").length;
  return Math.round((done / 4) * 100);
}

export function fmtDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
