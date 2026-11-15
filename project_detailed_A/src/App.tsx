import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  FlaskConical,
  GraduationCap,
  HelpCircle,
  History,
  Info,
  Lightbulb,
  ListChecks,
  Lock,
  Map,
  Play,
  RefreshCw,
  Repeat,
  RotateCcw,
  Sigma,
  Sparkles,
  Target,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import {
  EQUATION,
  STAGES,
  applyCheck,
  clearCurrentRun,
  fmtDate,
  getStage,
  isStorageAvailable,
  loadCompare,
  loadCurrentRun,
  loadFlags,
  loadHistory,
  newRun,
  progressPercent,
  pushHistory,
  saveCompare,
  saveCurrentRun,
  saveFlags,
  simulateRun,
  type CompareSnapshot,
  type Flags,
  type RouteEvent,
  type RunRecord,
  type RunState,
  type StageId,
  type Strategy,
} from "./lib/engine";

type View = "home" | "learn" | "compare" | "results";

const NAV: { id: View; label: string }[] = [
  { id: "home", label: "Главная" },
  { id: "learn", label: "Обучение" },
  { id: "compare", label: "Сравнение" },
  { id: "results", label: "Результаты" },
];

function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function Toggle({
  on,
  onChange,
  label,
  desc,
  accent = "indigo",
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
  accent?: "indigo" | "violet" | "rose";
}) {
  const bg = accent === "rose" ? "bg-rose-500" : accent === "violet" ? "bg-violet-600" : "bg-indigo-600";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-indigo-300 hover:shadow-sm"
    >
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {desc && <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{desc}</span>}
      </span>
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? bg : "bg-slate-300")}>
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all",
            on ? "left-6" : "left-1"
          )}
        />
      </span>
    </button>
  );
}

function StatChip({ label, value, tone = "slate" }: { label: string; value: string | number; tone?: "slate" | "green" | "rose" | "violet" }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-800",
    rose: "bg-rose-100 text-rose-800",
    violet: "bg-violet-100 text-violet-800",
  };
  return (
    <div className={cn("rounded-2xl px-3 py-2 text-center", tones[tone])}>
      <div className="text-lg font-extrabold leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-medium leading-tight">{label}</div>
    </div>
  );
}

function RouteTimeline({ events, compact = false }: { events: RouteEvent[]; compact?: boolean }) {
  if (events.length === 0) return <p className="text-sm text-slate-500">Маршрут пока пуст. Начните обучение.</p>;
  return (
    <ol className="space-y-2">
      {events.map((e) => {
        const icon =
          e.kind === "correct" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : e.kind === "error" ? (
            <XCircle className="h-4 w-4 text-rose-600" />
          ) : e.kind === "remedial-enter" ? (
            <Zap className="h-4 w-4 text-violet-600" />
          ) : e.kind === "remedial-exit" ? (
            <CheckCircle2 className="h-4 w-4 text-violet-600" />
          ) : (
            <Info className="h-4 w-4 text-slate-400" />
          );
        const stageLabel = e.stage === "R" ? "Доп. этап" : `Этап ${e.stage}`;
        return (
          <li key={e.id} className="anim-slide-in flex gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
            <span className="mt-0.5 shrink-0">{icon}</span>
            <span className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">{stageLabel}</span>
              {!compact && <span className="block text-xs leading-relaxed text-slate-700">{e.message}</span>}
              {compact && <span className="block truncate text-xs text-slate-700">{e.message}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function App() {
  const [view, setView] = useState<View>("home");
  const [run, setRun] = useState<RunState | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; kind: "success" | "error" | "warn" | "info" } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [history, setHistory] = useState<RunRecord[]>([]);
  const [flags, setFlags] = useState<Flags>({ aNoSimDone: false, aSimDone: false, bSimDone: false });
  const [storageWarn, setStorageWarn] = useState(false);
  const [restored, setRestored] = useState(false);
  const [learnStrategy, setLearnStrategy] = useState<Strategy>("A");
  const [learnSimulate, setLearnSimulate] = useState(false);

  const [cmpSimulate, setCmpSimulate] = useState(true);
  const [cmpA, setCmpA] = useState<RunState | null>(null);
  const [cmpB, setCmpB] = useState<RunState | null>(null);
  const [cmpRunning, setCmpRunning] = useState(false);
  const [cmpReveal, setCmpReveal] = useState(0);

  const recordedRef = useRef<string>("");
  const checkLockRef = useRef(false);

  // Загрузка при старте (восстановление после обновления страницы)
  useEffect(() => {
    if (!isStorageAvailable()) setStorageWarn(true);
    const saved = loadCurrentRun();
    if (saved) {
      setRun(saved);
      setLearnStrategy(saved.strategy);
      setLearnSimulate(saved.simulateError);
      setRestored(saved.status === "in-progress");
      if (saved.status === "completed") recordedRef.current = `${saved.startedAt}-${saved.finishedAt}`;
    }
    setHistory(loadHistory());
    setFlags(loadFlags());
    const cmp = loadCompare();
    if (cmp) {
      setCmpA(cmp.a);
      setCmpB(cmp.b);
      setCmpSimulate(cmp.simulateError);
      setCmpReveal(999);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Сохранение текущего запуска
  useEffect(() => {
    if (run) saveCurrentRun(run);
  }, [run]);

  // Автозаполнение симулированной ошибки на этапе 2
  useEffect(() => {
    if (run && run.current === 2 && run.simulateError && !run.completed.includes(2) && input === "") {
      setInput("20");
      setFeedback({
        text: "Симуляция ошибки включена: на этап 2 автоматически введён ответ 20 (вместо 8). Нажмите «Проверить», чтобы увидеть реакцию стратегии.",
        kind: "info",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.current, run?.simulateError]);

  // Тосты
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const startLearning = useCallback((strategy: Strategy, simulate: boolean) => {
    const r = newRun(strategy, simulate);
    setRun(r);
    setInput("");
    setFeedback(null);
    setShowHint(false);
    setRestored(false);
    recordedRef.current = "";
    setView("learn");
    window.scrollTo({ top: 0 });
  }, []);

  const handleCheck = useCallback(() => {
    if (!run || run.status === "completed") return;
    if (checkLockRef.current || checking) return; // защита от двойного нажатия
    checkLockRef.current = true;
    setChecking(true);
    // Небольшая задержка для наглядности и защиты от спама
    setTimeout(() => {
      const out = applyCheck(run, input);
      setRun(out.run);
      setFeedback({ text: out.feedback, kind: out.feedbackKind });
      if (out.hint) setShowHint(true);
      if (out.feedbackKind === "success") setInput("");
      checkLockRef.current = false;
      setChecking(false);
    }, 450);
  }, [run, input, checking]);

  // Фиксация завершённого запуска в историю (один раз)
  useEffect(() => {
    if (!run || run.status !== "completed" || !run.finishedAt) return;
    const key = `${run.startedAt}-${run.finishedAt}`;
    if (recordedRef.current === key) return;
    recordedRef.current = key;
    const rec: RunRecord = {
      strategy: run.strategy,
      simulateError: run.simulateError,
      errors: run.errors,
      extraTasks: run.extraTasks,
      correctCount: run.correctCount,
      attempts: run.attempts,
      status: run.status,
      routeLength: run.route.length,
      date: fmtDate(run.finishedAt),
    };
    pushHistory(rec);
    setHistory(loadHistory());
    setFlags((prev) => {
      const next = { ...prev };
      if (run.strategy === "A" && !run.simulateError) next.aNoSimDone = true;
      if (run.strategy === "A" && run.simulateError) next.aSimDone = true;
      if (run.strategy === "B" && run.simulateError) next.bSimDone = true;
      saveFlags(next);
      return next;
    });
  }, [run]);

  const handleStepClick = (id: StageId) => {
    if (!run) return;
    if (id === run.current) {
      setToast("Вы уже на этом этапе.");
      return;
    }
    if (run.completed.includes(id)) {
      setToast("Этап уже пройден. Повторная сдача не начисляет результат — двигайтесь вперёд.");
      return;
    }
    setToast("Этап ещё недоступен: сначала пройдите текущий этап. Следующий этап откроется после правильного ответа.");
  };

  const resetAll = () => {
    clearCurrentRun();
    setRun(null);
    setInput("");
    setFeedback(null);
    setShowHint(false);
    setToast("Прогресс сброшен. Можно начать заново.");
  };

  const runCompareAuto = () => {
    if (cmpRunning) return;
    setCmpRunning(true);
    setCmpReveal(0);
    const a = simulateRun("A", cmpSimulate);
    const b = simulateRun("B", cmpSimulate);
    setCmpA(a);
    setCmpB(b);
    const maxLen = Math.max(a.route.length, b.route.length);
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setCmpReveal(i);
      if (i >= maxLen) {
        clearInterval(timer);
        setCmpRunning(false);
        const snap: CompareSnapshot = { a, b, simulateError: cmpSimulate };
        saveCompare(snap);
      }
    }, 420);
  };

  const stage = run ? getStage(run.current) : STAGES[0];
  const pct = run ? progressPercent(run) : 0;

  return (
    <div className="min-h-screen">
      {/* Шапка */}
      <header className="sticky top-0 z-30 border-b border-indigo-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <button onClick={() => setView("home")} className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200">
              <Sigma className="h-5 w-5" />
            </span>
            <span className="text-left">
              <span className="block text-lg font-extrabold leading-none tracking-tight text-slate-900">MathPath</span>
              <span className="block text-[11px] font-medium text-slate-500">линейные уравнения по шагам</span>
            </span>
          </button>
          <nav className="ml-auto flex flex-wrap gap-1.5">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-semibold transition",
                  view === n.id ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                )}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {storageWarn && (
        <div className="mx-auto mt-3 max-w-6xl px-4">
          <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              LocalStorage недоступен в этом браузере. Сайт продолжит работу, но прогресс не сохранится после обновления страницы (используется временная память).
            </span>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
          <div className="anim-pop flex items-start gap-2 rounded-2xl border border-indigo-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-xl shadow-indigo-100">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <span>{toast}</span>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        {view === "home" && (
          <HomeView
            history={history}
            flags={flags}
            onStart={(s, sim) => startLearning(s, sim)}
            onGoCompare={() => setView("compare")}
            onGoLearn={() => {
              if (run) setView("learn");
              else startLearning(learnStrategy, learnSimulate);
            }}
            hasRun={Boolean(run)}
          />
        )}

        {view === "learn" && (
          <div className="anim-fade-up">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button onClick={() => setView("home")} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-indigo-700">
                <ArrowLeft className="h-4 w-4" /> Главная
              </button>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Обучение: {EQUATION}</h1>
              {restored && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  <History className="h-3.5 w-3.5" /> Прогресс восстановлен после обновления
                </span>
              )}
            </div>

            {/* Настройки запуска */}
            <div className="mb-4 grid gap-3 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-500">Стратегия обучения</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["A", "B"] as Strategy[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setLearnStrategy(s);
                        startLearning(s, learnSimulate);
                      }}
                      className={cn(
                        "rounded-2xl border px-3 py-2.5 text-left transition",
                        learnStrategy === s ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200" : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                      )}
                    >
                      <span className="block text-sm font-extrabold">Стратегия {s}</span>
                      <span className={cn("block text-[11px] leading-snug", learnStrategy === s ? "text-indigo-100" : "text-slate-500")}>
                        {s === "A" ? "Последовательная: повтор этапа" : "Адаптивная: доп. этап"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-500">Симуляция ошибки</p>
                <Toggle
                  on={learnSimulate}
                  onChange={(v) => {
                    setLearnSimulate(v);
                    startLearning(learnStrategy, v);
                  }}
                  label={learnSimulate ? "Симуляция включена" : "Симуляция выключена"}
                  desc="При включении на этапе 2 автоматически вводится 20 вместо 8 (2x = 20). Нажмите «Проверить», чтобы увидеть реакцию стратегии."
                  accent="rose"
                />
              </div>
            </div>

            {!run ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <GraduationCap className="mx-auto h-10 w-10 text-indigo-400" />
                <p className="mt-3 font-semibold text-slate-800">Запуск ещё не создан</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Выберите стратегию и режим симуляции выше, затем нажмите кнопку ниже.</p>
                <button onClick={() => startLearning(learnStrategy, learnSimulate)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700">
                  <Play className="h-4 w-4" /> Начать обучение
                </button>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
                {/* Левая колонка */}
                <div className="space-y-4">
                  {/* Прогресс */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-800">Прогресс маршрута</p>
                      <p className="text-sm font-extrabold text-indigo-700">{pct}%</p>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {STAGES.map((s) => {
                        const done = run.completed.includes(s.id);
                        const active = run.current === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => handleStepClick(s.id)}
                            className={cn(
                              "rounded-2xl border px-2 py-2.5 text-center transition",
                              active
                                ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                : done
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : "border-slate-200 bg-slate-50 text-slate-500 hover:border-indigo-300"
                            )}
                          >
                            <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-extrabold">
                              {done ? <Check className="h-4 w-4" /> : s.id}
                            </span>
                            <span className="mt-1 block text-[11px] font-bold leading-tight">{s.title}</span>
                          </button>
                        );
                      })}
                    </div>
                    {run.current === "R" && (
                      <div className="anim-pop mt-3 flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-900">
                        <Zap className="h-4 w-4 shrink-0" />
                        Вы на дополнительном обучающем этапе. После успеха вернёмся к этапу {run.remedialReturnTo ?? 2}.
                      </div>
                    )}
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      <StatChip label="Правильных ответов" value={run.correctCount} tone="green" />
                      <StatChip label="Ошибок" value={run.errors} tone="rose" />
                      <StatChip label="Доп. заданий" value={run.extraTasks} tone="violet" />
                      <StatChip label="Попыток" value={run.attempts} />
                    </div>
                  </div>

                  {/* Задание */}
                  <div className={cn("rounded-3xl border bg-white p-5 shadow-sm sm:p-6", feedback?.kind === "error" ? "anim-shake border-rose-300" : "border-slate-200")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full px-3 py-1 text-xs font-extrabold", run.current === "R" ? "bg-violet-600 text-white" : "bg-indigo-100 text-indigo-800")}>
                        {stage.num}
                      </span>
                      <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{stage.title}</h2>
                      <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        Стратегия {run.strategy} · Симуляция: {run.simulateError ? "вкл" : "выкл"}
                      </span>
                    </div>

                    <p className="mt-3 rounded-2xl bg-indigo-50 px-4 py-3 text-sm leading-relaxed text-indigo-950">{stage.rule}</p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Было</p>
                        <p className="mt-1 font-mono text-lg font-bold text-slate-800">{stage.before}</p>
                      </div>
                      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 px-4 py-3 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Станет</p>
                        <p className="mt-1 font-mono text-lg font-bold text-indigo-900">{stage.after}</p>
                      </div>
                    </div>

                    <label htmlFor="answer" className="mt-5 block text-sm font-bold text-slate-800">
                      {stage.prompt}
                    </label>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input
                        id="answer"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCheck();
                        }}
                        inputMode="decimal"
                        placeholder="Введите число, например 8"
                        disabled={run.status === "completed" || checking}
                        className="w-full flex-1 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
                      />
                      <button
                        onClick={handleCheck}
                        disabled={checking || run.status === "completed"}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {checking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        {checking ? "Проверяем…" : "Проверить"}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Нажмите Enter или кнопку «Проверить». Двойное нажатие защищено: повторная отправка блокируется.</p>

                    {run.current === 2 && run.simulateError && !run.completed.includes(2) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => setInput("20")}
                          className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-100"
                        >
                          <FlaskConical className="h-3.5 w-3.5" /> Ввести ошибочный ответ 20
                        </button>
                        <button
                          onClick={() => setInput("8")}
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                        >
                          <Check className="h-3.5 w-3.5" /> Ввести правильный ответ 8
                        </button>
                      </div>
                    )}

                    {feedback && (
                      <div
                        className={cn(
                          "anim-pop mt-4 rounded-2xl border px-4 py-3 text-sm leading-relaxed",
                          feedback.kind === "success" && "border-emerald-200 bg-emerald-50 text-emerald-950",
                          feedback.kind === "error" && "border-rose-200 bg-rose-50 text-rose-950",
                          feedback.kind === "warn" && "border-amber-200 bg-amber-50 text-amber-950",
                          feedback.kind === "info" && "border-indigo-200 bg-indigo-50 text-indigo-950"
                        )}
                      >
                        <span className="font-bold">{feedback.kind === "success" ? "✓ " : feedback.kind === "error" ? "✗ " : "ℹ "}</span>
                        {feedback.text}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowHint((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-900 hover:bg-amber-200"
                      >
                        <Lightbulb className="h-4 w-4" /> {showHint ? "Скрыть подсказку" : "Показать подсказку"}
                      </button>
                      <button onClick={resetAll} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">
                        <RotateCcw className="h-4 w-4" /> Сбросить запуск
                      </button>
                      <button onClick={() => setView("compare")} className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-900 hover:bg-violet-200">
                        <BarChart3 className="h-4 w-4" /> Сравнить стратегии
                      </button>
                    </div>

                    {showHint && (
                      <div className="anim-fade-up mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
                        <span className="font-bold">Подсказка: </span>
                        {stage.hint}
                        <span className="mt-1 block text-xs text-amber-800">{stage.explain}</span>
                      </div>
                    )}

                    {run.status === "completed" && (
                      <div className="anim-pop mt-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-center text-white shadow-lg shadow-emerald-200">
                        <Trophy className="mx-auto h-8 w-8" />
                        <p className="mt-2 text-lg font-extrabold">Запуск завершён! Ответ: x = 4</p>
                        <p className="mt-1 text-sm text-emerald-50">
                          Правильных: {run.correctCount} · Ошибок: {run.errors} · Доп. заданий: {run.extraTasks} · Попыток: {run.attempts}
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                          <button onClick={() => setView("results")} className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-emerald-800 hover:bg-emerald-50">
                            Смотреть результаты
                          </button>
                          <button onClick={() => startLearning(run.strategy, run.simulateError)} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/30 px-4 py-2 text-sm font-extrabold text-white ring-1 ring-white/40 hover:bg-emerald-900/50">
                            <Repeat className="h-4 w-4" /> Пройти заново
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Правая колонка: маршрут */}
                <aside className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                      <Map className="h-4 w-4 text-indigo-600" /> Ваш маршрут
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">Каждое действие фиксируется. Повторная сдача пройденного этапа результат не начисляет.</p>
                    <div className="mt-3 max-h-[420px] overflow-y-auto pr-1">
                      <RouteTimeline events={run.route} />
                    </div>
                  </div>
                  <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-4">
                    <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                      <BookOpen className="h-4 w-4 text-indigo-600" /> Как работает стратегия {run.strategy}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      {run.strategy === "A"
                        ? "При ошибке вы остаётесь на том же этапе и получаете подсказку. Следующий этап откроется только после правильного ответа."
                        : "При ошибке система определяет правило «обратные действия» и переводит вас на дополнительный этап. После успеха вы возвращаетесь к основному маршруту."}
                    </p>
                  </div>
                </aside>
              </div>
            )}
          </div>
        )}

        {view === "compare" && (
          <CompareView
            cmpSimulate={cmpSimulate}
            setCmpSimulate={setCmpSimulate}
            cmpA={cmpA}
            cmpB={cmpB}
            cmpRunning={cmpRunning}
            cmpReveal={cmpReveal}
            onRunAuto={runCompareAuto}
            onStartManual={(s) => startLearning(s, cmpSimulate)}
            flags={flags}
          />
        )}

        {view === "results" && (
          <ResultsView
            run={run}
            history={history}
            cmpA={cmpA}
            cmpB={cmpB}
            onRestart={() => startLearning(run?.strategy ?? "A", run?.simulateError ?? false)}
            onGoCompare={() => setView("compare")}
            onGoLearn={() => (run ? setView("learn") : startLearning("A", false))}
          />
        )}
      </main>

      <footer className="border-t border-indigo-100 bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
            <Sigma className="h-4 w-4 text-indigo-600" /> MathPath
          </span>
          <span>Статическое приложение без регистрации и сервера. Статистика хранится в LocalStorage.</span>
          <span className="ml-auto">Уравнение: {EQUATION} · Ответ: x = 4</span>
        </div>
      </footer>
    </div>
  );
}

function HomeView({
  history,
  flags,
  onStart,
  onGoCompare,
  onGoLearn,
  hasRun,
}: {
  history: RunRecord[];
  flags: Flags;
  onStart: (s: Strategy, sim: boolean) => void;
  onGoCompare: () => void;
  onGoLearn: () => void;
  hasRun: boolean;
}) {
  const [sim, setSim] = useState(false);
  return (
    <div className="anim-fade-up space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-6 text-white shadow-xl shadow-indigo-200 sm:p-10">
        <div className="grid items-center gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Интерактивный тренажёр
            </p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              MathPath: решай уравнения по шагам, а не наугад
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-indigo-100 sm:text-base">
              Ученик проходит этапы строго по порядку, получает подсказки при ошибках и видит свой маршрут. Сравните две стратегии обучения на одном уравнении — с одинаковыми данными и одинаковой ошибкой.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => onStart("A", sim)} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-indigo-800 shadow hover:bg-indigo-50">
                <Play className="h-4 w-4" /> Начать обучение
              </button>
              <button onClick={onGoCompare} className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-extrabold text-white ring-1 ring-white/40 hover:bg-white/25">
                <BarChart3 className="h-4 w-4" /> Сравнить стратегии
              </button>
              {hasRun && (
                <button onClick={onGoLearn} className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-extrabold text-emerald-950 hover:bg-emerald-300">
                  <History className="h-4 w-4" /> Продолжить запуск
                </button>
              )}
            </div>
            <div className="mt-4 max-w-md">
              <Toggle on={sim} onChange={setSim} label={sim ? "Симуляция ошибки: включена" : "Симуляция ошибки: выключена"} desc="Этап 2: будет введён ответ 20 вместо 8. Удобно для контрольного сценария." accent="rose" />
            </div>
          </div>
          <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-lg">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Учебный сценарий</p>
            <p className="mt-2 text-center font-mono text-2xl font-extrabold tracking-tight text-indigo-900 sm:text-3xl">{EQUATION}</p>
            <ol className="mt-4 space-y-2">
              {STAGES.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-extrabold text-white">{s.id}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-800">{s.title}</span>
                    <span className="block truncate font-mono text-xs text-slate-500">
                      {s.before} → {s.after}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-center text-sm font-extrabold text-emerald-800">Ответ: x = 4 · Проверка: 2(4 + 3) = 14 ✓</p>
          </div>
        </div>
      </section>

      {/* Стратегии */}
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 font-extrabold text-white">A</span>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Последовательное обучение</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" /> Этапы строго по порядку, следующий закрыт до успеха.</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" /> При ошибке — подсказка и повтор текущего этапа.</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" /> Маршрут не меняется: ученик остаётся на месте.</li>
          </ul>
          <button onClick={() => onStart("A", sim)} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700">
            Запустить A <ArrowRight className="h-4 w-4" />
          </button>
        </article>
        <article className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-600 font-extrabold text-white">B</span>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Адаптивное обучение</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" /> Те же этапы, но ошибка диагностируется.</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" /> Переход на доп. этап «Обратные действия».</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" /> После успеха — возврат к основному маршруту.</li>
          </ul>
          <button onClick={() => onStart("B", sim)} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700">
            Запустить B <ArrowRight className="h-4 w-4" />
          </button>
        </article>
      </section>

      {/* Контрольный сценарий */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900">
          <ListChecks className="h-5 w-5 text-indigo-600" /> Воспроизводимый контрольный сценарий
        </h2>
        <p className="mt-1 text-sm text-slate-500">Выполните шаги по порядку — поведение стратегий воспроизводимо при одинаковых данных.</p>
        <ol className="mt-4 grid gap-2 md:grid-cols-2">
          {[
            "Запустите стратегию A с выключенной симуляцией и пройдите все этапы правильно (6 → 8 → 4 → 14).",
            "Повторите сценарий A с включённой симуляцией: на этапе 2 вводится 20 — стратегия A задерживает вас на этапе 2 и показывает подсказку.",
            "Запустите стратегию B с теми же данными (симуляция включена): после 20 система переводит вас на доп. этап «Обратные действия».",
            "Выполните доп. задание (14 − 6 = 8) и вернитесь к этапу 2, затем завершите маршрут.",
          ].map((t, i) => (
            <li key={i} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-extrabold text-white">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
          <span className={cn("rounded-full px-3 py-1.5", flags.aNoSimDone ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500")}>
            {flags.aNoSimDone ? "✓" : "○"} A без симуляции пройдена
          </span>
          <span className={cn("rounded-full px-3 py-1.5", flags.aSimDone ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500")}>
            {flags.aSimDone ? "✓" : "○"} A с симуляцией пройдена
          </span>
          <span className={cn("rounded-full px-3 py-1.5", flags.bSimDone ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500")}>
            {flags.bSimDone ? "✓" : "○"} B с симуляцией пройдена
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-1.5 text-indigo-800">Завершённых запусков: {history.length}</span>
        </div>
      </section>

      {/* Возможности */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Target, title: "Настоящая проверка", text: "Каждое число сверяется с эталоном этапа. Пустой ввод, буквы и повторные нажатия обрабатываются отдельно." },
          { icon: Map, title: "Видимый маршрут", text: "Лента событий фиксирует успехи, ошибки и переходы. Прогресс сохраняется в LocalStorage и переживает обновление страницы." },
          { icon: Brain, title: "Разные маршруты", text: "При одной ошибке 20 стратегия A повторяет этап, а B уходит на доп. обучение и возвращается обратно." },
        ].map((c) => (
          <article key={c.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <c.icon className="h-6 w-6 text-indigo-600" />
            <h3 className="mt-2 font-extrabold text-slate-900">{c.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

function ComparePanel({ title, accent, run, reveal, running }: { title: string; accent: "indigo" | "violet"; run: RunState | null; reveal: number; running: boolean }) {
  const shown = run ? run.route.slice(0, reveal) : [];
  const done = run?.status === "completed";
  return (
    <article className={cn("rounded-3xl border bg-white p-5 shadow-sm", accent === "indigo" ? "border-indigo-200" : "border-violet-200")}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
        <span
          className={cn(
            "ml-auto rounded-full px-3 py-1 text-xs font-extrabold",
            done ? "bg-emerald-100 text-emerald-800" : run ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"
          )}
        >
          {done ? "✓ Завершён" : run ? "● В процессе" : "○ Не запущен"}
        </span>
      </div>
      {run ? (
        <>
          <div className="mt-3 grid grid-cols-4 gap-2">
            <StatChip label="Ошибок" value={run.errors} tone="rose" />
            <StatChip label="Доп. заданий" value={run.extraTasks} tone="violet" />
            <StatChip label="Верных" value={run.correctCount} tone="green" />
            <StatChip label="Событий" value={shown.length} />
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Текущий этап: {run.current === "R" ? "Доп. этап" : `Этап ${run.current}`} · Симуляция: {run.simulateError ? "включена" : "выключена"}
          </p>
          <div className="mt-2 max-h-[360px] overflow-y-auto pr-1">
            {running && shown.length < run.route.length ? (
              <RouteTimeline events={shown} compact />
            ) : (
              <RouteTimeline events={shown} />
            )}
          </div>
        </>
      ) : (
        <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Нажмите «Запустить обе стратегии», чтобы прогнать одинаковый сценарий через обе маршрутизации.
        </p>
      )}
    </article>
  );
}

function CompareView({
  cmpSimulate,
  setCmpSimulate,
  cmpA,
  cmpB,
  cmpRunning,
  cmpReveal,
  onRunAuto,
  onStartManual,
  flags,
}: {
  cmpSimulate: boolean;
  setCmpSimulate: (v: boolean) => void;
  cmpA: RunState | null;
  cmpB: RunState | null;
  cmpRunning: boolean;
  cmpReveal: number;
  onRunAuto: () => void;
  onStartManual: (s: Strategy) => void;
  flags: Flags;
}) {
  const bothDone = cmpA?.status === "completed" && cmpB?.status === "completed";
  return (
    <div className="anim-fade-up space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Сравнение стратегий</h1>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">Одинаковые данные · одинаковая ошибка</span>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle
              on={cmpSimulate}
              onChange={setCmpSimulate}
              label={cmpSimulate ? "Симуляция ошибки: включена" : "Симуляция ошибки: выключена"}
              desc={cmpSimulate ? "Обе стратегии получат на этапе 2 ответ 20 вместо 8." : "Обе стратегии пройдут без ошибок: 6 → 8 → 4 → 14."}
              accent="rose"
            />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
              <span className="font-bold text-slate-800">Исходные данные:</span> {EQUATION}. Этап 1 = 6, этап 2 = 8 (ошибка 20), этап 3 = 4, этап 4 = 14, доп. задание = 8.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onRunAuto} disabled={cmpRunning} className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60">
              {cmpRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {cmpRunning ? "Выполняется…" : "Запустить обе стратегии"}
            </button>
            <button onClick={() => onStartManual("A")} className="rounded-full bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200">
              Вручную: A
            </button>
            <button onClick={() => onStartManual("B")} className="rounded-full bg-violet-100 px-4 py-3 text-sm font-bold text-violet-900 hover:bg-violet-200">
              Вручную: B
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ComparePanel title="Стратегия A — последовательная" accent="indigo" run={cmpA} reveal={cmpReveal} running={cmpRunning} />
        <ComparePanel title="Стратегия B — адаптивная" accent="violet" run={cmpB} reveal={cmpReveal} running={cmpRunning} />
      </div>

      {bothDone && cmpA && cmpB && (
        <div className="anim-fade-up rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
            <BarChart3 className="h-5 w-5 text-indigo-600" /> Различия при одинаковых данных
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-2 pr-3">Показатель</th>
                  <th className="py-2 pr-3">Стратегия A</th>
                  <th className="py-2">Стратегия B</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 pr-3 font-semibold text-slate-700">Реакция на ошибку 20</td>
                  <td className="py-2.5 pr-3">Остаётся на этапе 2, подсказка «вычти 6»</td>
                  <td className="py-2.5">Переход на доп. этап «Обратные действия»</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-semibold text-slate-700">Ошибок</td>
                  <td className="py-2.5 pr-3">{cmpA.errors}</td>
                  <td className="py-2.5">{cmpB.errors}</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-semibold text-slate-700">Дополнительных заданий</td>
                  <td className="py-2.5 pr-3">{cmpA.extraTasks}</td>
                  <td className="py-2.5">{cmpB.extraTasks}</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-semibold text-slate-700">Длина маршрута (событий)</td>
                  <td className="py-2.5 pr-3">{cmpA.route.length}</td>
                  <td className="py-2.5">{cmpB.route.length}</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-semibold text-slate-700">Итоговый статус</td>
                  <td className="py-2.5 pr-3">Завершён, x = 4</td>
                  <td className="py-2.5">Завершён, x = 4 (через доп. этап)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 rounded-2xl bg-indigo-50 px-4 py-3 text-sm leading-relaxed text-indigo-950">
            <span className="font-bold">Вывод:</span> при одинаковой ошибке 20 стратегия A удлиняет маршрут повтором этапа 2, а стратегия B вставляет обучающий блок и возвращается к этапу 2. Итоговый ответ одинаков (x = 4), но учебный путь разный — это и есть проверяемое различие.
          </p>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
          <Eye className="h-5 w-5 text-indigo-600" /> Проверка воспроизводимости
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            { ok: flags.aNoSimDone, label: "A без симуляции: все этапы верно" },
            { ok: flags.aSimDone, label: "A с симуляцией: задержка на этапе 2" },
            { ok: flags.bSimDone, label: "B с симуляцией: доп. этап и возврат" },
          ].map((c) => (
            <div key={c.label} className={cn("flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-semibold", c.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-500")}>
              {c.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <HelpCircle className="h-4 w-4 shrink-0" />}
              {c.label}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Галочки появляются после ручного прохождения в разделе «Обучение». Автоматический прогон выше использует ту же функцию проверки ответов, что и ручной режим.
        </p>
      </div>
    </div>
  );
}

function ResultsView({
  run,
  history,
  cmpA,
  cmpB,
  onRestart,
  onGoCompare,
  onGoLearn,
}: {
  run: RunState | null;
  history: RunRecord[];
  cmpA: RunState | null;
  cmpB: RunState | null;
  onRestart: () => void;
  onGoCompare: () => void;
  onGoLearn: () => void;
}) {
  const done = run?.status === "completed" ? run : null;
  const last = history[0] ?? null;
  return (
    <div className="anim-fade-up space-y-4">
      <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Результаты</h1>

      {done ? (
        <>
          <section className="rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-xl shadow-emerald-200 sm:p-8">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/20">
                <Trophy className="h-7 w-7" />
              </span>
              <div>
                <p className="text-2xl font-extrabold tracking-tight">Уравнение решено: x = 4</p>
                <p className="text-sm text-emerald-50">
                  Стратегия {done.strategy} · Симуляция ошибки: {done.simulateError ? "была включена" : "была выключена"} · Завершено {done.finishedAt ? fmtDate(done.finishedAt) : ""}
                </p>
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                <button onClick={onRestart} className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-extrabold text-emerald-800 hover:bg-emerald-50">
                  <Repeat className="h-4 w-4" /> Пройти заново
                </button>
                <button onClick={onGoCompare} className="rounded-full bg-emerald-900/30 px-4 py-2.5 text-sm font-extrabold text-white ring-1 ring-white/40 hover:bg-emerald-900/50">
                  Сравнить стратегии
                </button>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-2xl bg-white/15 px-4 py-3 text-center">
                <p className="text-2xl font-extrabold">{done.correctCount}</p>
                <p className="text-xs font-semibold text-emerald-50">правильных ответов</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 text-center">
                <p className="text-2xl font-extrabold">{done.errors}</p>
                <p className="text-xs font-semibold text-emerald-50">допущенных ошибок</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 text-center">
                <p className="text-2xl font-extrabold">{done.extraTasks}</p>
                <p className="text-xs font-semibold text-emerald-50">дополнительных заданий</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 text-center">
                <p className="text-2xl font-extrabold">{done.attempts}</p>
                <p className="text-xs font-semibold text-emerald-50">всего попыток</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-extrabold text-slate-900">
                <Map className="h-5 w-5 text-indigo-600" /> Пройденный маршрут
              </h2>
              <div className="mt-3 max-h-[380px] overflow-y-auto pr-1">
                <RouteTimeline events={done.route} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="flex items-center gap-2 font-extrabold text-slate-900">
                  <BarChart3 className="h-5 w-5 text-indigo-600" /> Сравнение поведения стратегий
                </h2>
                {cmpA && cmpB ? (
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between rounded-2xl bg-indigo-50 px-4 py-2.5">
                      <span className="font-bold text-indigo-900">A: ошибок {cmpA.errors}, доп. {cmpA.extraTasks}, событий {cmpA.route.length}</span>
                      <span className="text-indigo-700">повтор этапа 2</span>
                    </div>
                    <div className="flex justify-between rounded-2xl bg-violet-50 px-4 py-2.5">
                      <span className="font-bold text-violet-900">B: ошибок {cmpB.errors}, доп. {cmpB.extraTasks}, событий {cmpB.route.length}</span>
                      <span className="text-violet-700">доп. этап → возврат</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500">Данные сравнения: {cmpA.simulateError ? "симуляция включена (ошибка 20)" : "симуляция выключена"}. Итог одинаковый — x = 4, маршруты разные.</p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Запустите автоматическое сравнение, чтобы увидеть обе траектории рядом.</p>
                )}
                <button onClick={onGoCompare} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700">
                  Открыть сравнение <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
                <h2 className="flex items-center gap-2 font-extrabold text-slate-900">
                  <GraduationCap className="h-5 w-5 text-indigo-600" /> Что усвоено
                </h2>
                <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-700">
                  <li>• Раскрытие скобок: 2(x + 3) = 2x + 6.</li>
                  <li>• Вычитание 6 из обеих частей: 2x = 8 (обратное действие к +6).</li>
                  <li>• Деление на 2: x = 4. Проверка: 2(4 + 3) = 14.</li>
                </ul>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Trophy className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-extrabold text-slate-800">Завершённых запусков пока нет</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            {run ? "Текущий запуск ещё не завершён — продолжите его в разделе «Обучение»." : "Пройдите обучение, и здесь появится итоговая статистика, маршрут и сравнение стратегий."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button onClick={onGoLearn} className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
              <Play className="h-4 w-4" /> {run ? "Продолжить обучение" : "Начать обучение"}
            </button>
            <button onClick={onGoCompare} className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200">
              Сравнить стратегии
            </button>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-extrabold text-slate-900">
          <History className="h-5 w-5 text-indigo-600" /> История запусков ({history.length})
        </h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">История пуста. Завершённые запуски автоматически сохраняются в LocalStorage.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-2 pr-3">Дата</th>
                  <th className="py-2 pr-3">Стратегия</th>
                  <th className="py-2 pr-3">Симуляция</th>
                  <th className="py-2 pr-3">Верных</th>
                  <th className="py-2 pr-3">Ошибок</th>
                  <th className="py-2 pr-3">Доп.</th>
                  <th className="py-2 pr-3">Попыток</th>
                  <th className="py-2">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h, i) => (
                  <tr key={`${h.date}-${i}`}>
                    <td className="py-2.5 pr-3 text-slate-600">{h.date}</td>
                    <td className="py-2.5 pr-3 font-bold text-slate-800">{h.strategy === "A" ? "A (последовательная)" : "B (адаптивная)"}</td>
                    <td className="py-2.5 pr-3">{h.simulateError ? "Включена (20)" : "Выключена"}</td>
                    <td className="py-2.5 pr-3">{h.correctCount}</td>
                    <td className="py-2.5 pr-3">{h.errors}</td>
                    <td className="py-2.5 pr-3">{h.extraTasks}</td>
                    <td className="py-2.5 pr-3">{h.attempts}</td>
                    <td className="py-2.5">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">Завершён</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {last && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <Info className="h-3.5 w-3.5" /> Последний запуск: стратегия {last.strategy}, ошибок {last.errors}, доп. заданий {last.extraTasks}.
          </p>
        )}
      </section>
    </div>
  );
}
