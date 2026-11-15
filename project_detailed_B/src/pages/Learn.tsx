import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Badge, Button, Card, FeedbackBox, ProgressBar, Toggle } from '@/components/ui';
import {
  STRATEGY_NAMES,
  currentRemedialTask,
  isSimulatedTurn,
  submitKey,
  turnKey,
  type EventType,
  type Strategy,
} from '@/lib/engine';
import { EQUATION, MAIN_STEPS, REMEDIAL, SIM_WRONG_ANSWER, STATES } from '@/lib/scenario';
import type { Navigate } from '@/hooks/useRoute';
import type { Store } from '@/hooks/useMathPath';
import { cn } from '@/utils/cn';

const KEYPAD = ['x', '=', '(', ')', '+', '−', '×', '÷'];

const EVENT_STYLE: Record<EventType, string> = {
  start: 'bg-slate-400',
  ok: 'bg-emerald-500',
  error: 'bg-rose-500',
  hint: 'bg-amber-400',
  sim: 'bg-fuchsia-500',
  remedial_enter: 'bg-violet-500',
  remedial_ok: 'bg-violet-400',
  remedial_error: 'bg-rose-400',
  return: 'bg-sky-500',
  complete: 'bg-emerald-600',
};

function Stat({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className={cn('text-2xl font-extrabold', className)}>{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

export default function Learn({ store, navigate }: { store: Store; navigate: Navigate }) {
  const { data, submit, setSimulate, restartRun, selectStrategy, restored, dismissRestored } = store;
  const strategy = data.selected;
  const run = data.runs[strategy];
  const tk = turnKey(run);
  const done = run.phase === 'done';
  const simTurn = isSimulatedTurn(run);
  const remTask = currentRemedialTask(run);
  const remMod = run.remedialModule ? REMEDIAL[run.remedialModule] : null;
  const step = MAIN_STEPS[run.stepIndex];

  const [input, setInput] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const busy = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // При смене задания поле очищается; на этапе 2 в симуляции оно заполняется ошибочным ответом
  useEffect(() => {
    setInput(isSimulatedTurn(run) ? SIM_WRONG_ANSWER : '');
    setNotice(null);
  }, [tk, run.id]);

  const doneCount = done ? MAIN_STEPS.length : run.completed.length;
  const progress = (doneCount / MAIN_STEPS.length) * 100;
  const correct = run.mainCorrect + run.remedialCorrect;

  function check(e?: FormEvent) {
    e?.preventDefault();
    if (busy.current || done) return;
    // защита от двойного нажатия: пока идёт проверка, повторный клик игнорируется
    busy.current = true;
    window.setTimeout(() => {
      busy.current = false;
    }, 400);
    setNotice(null);
    submit(strategy, input, submitKey(run));
  }

  function lockedClick(i: number) {
    setNotice(
      `Этап ${i + 1} «${MAIN_STEPS[i].title}» пока недоступен. Сначала выполните текущий этап ${run.stepIndex + 1} «${step.title}».`,
    );
  }

  const placeholder = remTask
    ? remTask.kind === 'num'
      ? 'Введите число'
      : remTask.kind === 'expr'
        ? 'Запишите выражение'
        : 'Запишите равенство'
    : 'Запишите равенство со знаком =';

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-violet-600">Страница обучения</p>
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Решаем уравнение</h1>
          <p className="mt-1 font-mono text-lg text-slate-600">{EQUATION}</p>
        </div>
        <Button variant="secondary" onClick={() => restartRun(strategy)}>
          ↻ Начать заново
        </Button>
      </div>

      {restored && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-900">
          <p className="text-sm">
            Прогресс восстановлен: страница была обновлена во время прохождения. Вы продолжаете с текущего этапа.
          </p>
          <button type="button" onClick={dismissRestored} className="shrink-0 text-sm font-semibold underline">
            Закрыть
          </button>
        </div>
      )}

      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.1fr]">
          {(['A', 'B'] as Strategy[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => selectStrategy(s)}
              aria-pressed={s === strategy}
              className={cn(
                'rounded-2xl border-2 p-4 text-left transition',
                s === strategy
                  ? 'border-violet-500 bg-violet-50 shadow-md shadow-violet-100'
                  : 'border-slate-200 hover:border-violet-300',
              )}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Стратегия {s}</span>
              <span className="mt-1 block font-bold text-slate-900">{STRATEGY_NAMES[s]}</span>
              <span className="mt-1 block text-sm text-slate-600">
                {s === 'A'
                  ? 'При ошибке — подсказка и повтор того же этапа.'
                  : 'При ошибке — дополнительный обучающий этап, затем возврат к задаче.'}
              </span>
            </button>
          ))}
          <Toggle
            id="simulate-toggle"
            checked={run.simulate}
            onChange={(v) => setSimulate(strategy, v)}
            label="Симуляция ошибки"
            description="На этапе 2 поле заполняется ошибкой 2x = 20. Переключение перезапускает прохождение."
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <Card>
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MAIN_STEPS.map((st, i) => {
                const isDone = done || run.completed.includes(st.id);
                const isCurrent = !isDone && i === run.stepIndex;
                const isLocked = !isDone && !isCurrent;
                return (
                  <li key={st.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (isLocked) lockedClick(i);
                      }}
                      aria-disabled={isLocked}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-2xl border-2 p-3 text-left text-sm transition',
                        isDone && 'border-emerald-300 bg-emerald-50 text-emerald-900',
                        isCurrent && 'border-violet-500 bg-violet-50 text-violet-900 shadow-md shadow-violet-100',
                        isLocked && 'border-slate-200 bg-slate-50 text-slate-400',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          isDone && 'bg-emerald-500 text-white',
                          isCurrent && 'bg-violet-600 text-white',
                          isLocked && 'bg-slate-200 text-slate-500',
                        )}
                      >
                        {isDone ? '✓' : i + 1}
                      </span>
                      <span className="font-semibold leading-tight">
                        {st.title}
                        {isCurrent && run.phase === 'remedial' && (
                          <span className="block text-xs font-medium text-violet-600">↺ доп. этап</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="mt-5">
              <ProgressBar value={progress} label={`Прогресс: этапов ${doneCount} из ${MAIN_STEPS.length}`} />
            </div>
            {notice && (
              <div className="animate-pop mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                🔒 {notice}
              </div>
            )}
          </Card>

          <Card>
            {done && (
              <div className="animate-pop space-y-5 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
                  🎉
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Уравнение решено: x = 4</h2>
                  <p className="mt-2 text-slate-600">
                    Стратегия {strategy}. Правильных ответов: {correct}. Ошибок: {run.errors}.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button onClick={() => navigate('/results')}>Смотреть результаты</Button>
                  <Button variant="secondary" onClick={() => restartRun(strategy)}>
                    Пройти заново
                  </Button>
                </div>
              </div>
            )}

            {!done && run.phase === 'remedial' && remMod && remTask && (
              <div className="animate-fade-up space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="fuchsia">Дополнительный этап</Badge>
                  <Badge tone="slate">
                    Задание {run.remedialIndex + 1} из {remMod.tasks.length}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{remMod.title}</h2>
                <p className="text-slate-600">
                  Система определила пробел: <b>{remMod.ruleLabel}</b>. Прочитайте короткое объяснение и выполните
                  задания. После этого вы вернётесь к этапу {run.stepIndex + 1} «{step.title}».
                </p>
                <ul className="space-y-2 rounded-2xl bg-violet-50 p-4 text-sm text-slate-700">
                  {remMod.explanation.map((line, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-violet-500">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-2xl border-2 border-dashed border-violet-300 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Задание</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{remTask.prompt}</p>
                </div>
              </div>
            )}

            {!done && run.phase === 'main' && (
              <div className="animate-fade-up space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-violet-600">
                    Этап {run.stepIndex + 1} из {MAIN_STEPS.length}
                  </span>
                  {simTurn && <Badge tone="fuchsia">Симуляция ошибки</Badge>}
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{step.title}</h2>
                <p className="text-slate-600">{step.instruction}</p>
                <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Текущее уравнение</p>
                  <p className="mt-2 font-mono text-3xl font-bold text-slate-900 sm:text-4xl">{STATES[run.stepIndex]}</p>
                </div>
                {simTurn && (
                  <p className="rounded-xl bg-fuchsia-50 px-3 py-2 text-sm text-fuchsia-800">
                    Симуляция включена: поле заполнено типичной ошибкой «{SIM_WRONG_ANSWER}» (6 прибавили вместо
                    вычитания). Нажмите «Проверить» или исправьте ответ.
                  </p>
                )}
                {run.attempts > 0 && (
                  <p className="text-sm text-slate-500">Неверных попыток на этом этапе: {run.attempts}</p>
                )}
              </div>
            )}
          </Card>

          {!done && (
            <Card>
              <form onSubmit={check} className="space-y-4">
                <label htmlFor="answer" className="block text-sm font-semibold text-slate-700">
                  Ваш ответ
                </label>
                <input
                  id="answer"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={placeholder}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={80}
                  className="w-full rounded-2xl border-2 border-violet-200 bg-white px-4 py-3 font-mono text-lg outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
                <div className="flex flex-wrap gap-2" aria-label="Символы">
                  {KEYPAD.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setInput((v) => v + k);
                        inputRef.current?.focus();
                      }}
                      className="h-10 min-w-10 rounded-xl bg-slate-100 px-3 font-mono font-semibold text-slate-700 transition hover:bg-violet-100 active:scale-95"
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit">Проверить</Button>
                  <Button variant="ghost" onClick={() => setInput('')}>
                    Очистить
                  </Button>
                  <span className="text-xs text-slate-500">Enter — проверить</span>
                </div>
              </form>
              <div className="mt-4">
                <FeedbackBox key={run.route.length} fb={run.feedback} />
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-bold text-slate-900">Статистика прохождения</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="Допущено ошибок" value={run.errors} className="text-rose-600" />
              <Stat label="Правильных ответов" value={correct} className="text-emerald-600" />
              <Stat label="Доп. этапов открыто" value={run.remedialEntries} className="text-violet-600" />
              <Stat label="Доп. заданий выполнено" value={run.remedialCorrect} className="text-indigo-600" />
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-slate-900">Маршрут</h3>
            <p className="text-sm text-slate-500">
              Стратегия {strategy}: {STRATEGY_NAMES[strategy]}
            </p>
            <ol className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
              {run.route.map((ev, i) => (
                <li key={i} className="animate-fade-up flex gap-3">
                  <span className={cn('mt-1.5 h-3 w-3 shrink-0 rounded-full', EVENT_STYLE[ev.type])} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{ev.label}</p>
                    <p className="text-sm text-slate-600">{ev.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
