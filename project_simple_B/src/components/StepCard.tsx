import { useEffect, useMemo, useRef, useState } from 'react';
import type { ScenarioStep, StrategyId } from '@/data/types';
import { checkAnswer, diffFeedback } from '@/lib/answer';
import { Icon } from './Icon';

interface StepCardProps {
  step: ScenarioStep;
  index: number;
  total: number;
  strategy: StrategyId;
  mode: 'step' | 'retry';
  hintsUsed: number;
  failCount: number;
  onHint: () => void;
  onSubmit: (given: string, correct: boolean) => void;
  onSuccess: () => void;
  onErrorBranch: () => void;
}

const MAX_HINTS: Record<StrategyId, number> = { A: 3, B: 1 };

export function StepCard({
  step,
  index,
  total,
  strategy,
  mode,
  hintsUsed,
  failCount,
  onHint,
  onSubmit,
  onSuccess,
  onErrorBranch,
}: StepCardProps) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'wrong' | 'correct'>('idle');
  const [revealed, setRevealed] = useState(false);
  const [localFails, setLocalFails] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const branchRef = useRef(onErrorBranch);
  branchRef.current = onErrorBranch;

  const maxHints = MAX_HINTS[strategy];
  const hintsLeft = Math.max(0, maxHints - hintsUsed);
  const visibleHints = step.hints.slice(0, Math.min(hintsUsed, step.hints.length));

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Автоматический переход по маршруту после ошибки.
  useEffect(() => {
    if (status !== 'wrong' || mode !== 'step') return;
    const t = window.setTimeout(() => branchRef.current(), 3000);
    return () => window.clearTimeout(t);
  }, [status, mode]);

  const feedback = useMemo(
    () => (status === 'wrong' ? diffFeedback(value, step.answer) : null),
    [status, value, step.answer],
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim()) return;
    const correct = checkAnswer(value, step.answer, step.accepts);
    onSubmit(value, correct);
    if (correct) {
      setStatus('correct');
    } else {
      setStatus('wrong');
      setLocalFails((f) => f + 1);
    }
  };

  return (
    <div className="anim-fade-up space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400/30">
          {mode === 'retry' ? 'Повтор шага' : `Шаг ${index} из ${total}`}
        </span>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/10">
          Навык: {step.title}
        </span>
        {failCount > 0 && (
          <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-200 ring-1 ring-rose-400/30">
            ошибок на шаге: {failCount}
          </span>
        )}
      </div>

      <div className="glass rounded-2xl px-5 py-4 sm:px-7 sm:py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Уравнение на этом шаге
        </p>
        <p className="mt-2 font-mono text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {step.state}
        </p>
      </div>

      <div>
        <p className="text-sm leading-relaxed text-slate-200">{step.goal}</p>
        {strategy === 'B' && (
          <p className="mt-2 text-xs text-emerald-300/80">
            Стратегия «Смена метода»: подсказка всего одна — сначала подумай, потом проверь.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (status === 'wrong') setStatus('idle');
            }}
            placeholder="введи уравнение, например 3x-2=2x+6"
            autoComplete="off"
            spellCheck={false}
            className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3.5 font-mono text-lg text-white outline-none transition placeholder:font-sans placeholder:text-sm placeholder:text-slate-500 focus:ring-2 ${
              status === 'wrong'
                ? 'border-rose-400/60 focus:ring-rose-400/40'
                : status === 'correct'
                  ? 'border-emerald-400/60 focus:ring-emerald-400/40'
                  : 'border-white/10 focus:border-indigo-400/60 focus:ring-indigo-400/40'
            }`}
          />
          <button
            type="submit"
            disabled={!value.trim() || status === 'correct'}
            className="shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Проверить
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onHint}
            disabled={hintsLeft === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-400/10 px-3.5 py-2 text-xs font-semibold text-amber-200 ring-1 ring-amber-400/30 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Icon name="lightbulb" className="h-4 w-4" />
            {hintsLeft > 0 ? `Подсказка (${hintsLeft})` : 'Подсказки закончились'}
          </button>
          {mode === 'retry' && localFails >= 2 && !revealed && (
            <button
              type="button"
              onClick={() => {
                setRevealed(true);
                setStatus('correct');
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
            >
              <Icon name="book" className="h-4 w-4" />
              Показать решение
            </button>
          )}
        </div>
      </form>

      {visibleHints.length > 0 && (
        <div className="space-y-2">
          {visibleHints.map((h, i) => (
            <div
              key={i}
              className="anim-fade-up flex gap-3 rounded-xl border border-amber-300/20 bg-amber-300/8 px-4 py-3"
            >
              <Icon name="lightbulb" className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <p className="text-sm leading-relaxed text-amber-100/90">
                <span className="font-semibold">Подсказка {i + 1}: </span>
                {h}
              </p>
            </div>
          ))}
        </div>
      )}

      {status === 'wrong' && feedback && (
        <div className="anim-shake rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
            <div className="space-y-3">
              <p className="text-sm font-semibold text-rose-100">Пока не то</p>
              <p className="text-sm leading-relaxed text-rose-100/85">{feedback.text}</p>

              {mode === 'step' ? (
                <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-200">
                    <Icon name="route" className="h-4 w-4" />
                    Маршрут меняется
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    {strategy === 'A'
                      ? 'Маршрут А: разбираем правило → тренируемся на микро-задачах → повторяем шаг → проверяем равновесие на весах → идём дальше по плану.'
                      : 'Маршрут Б: алгебраические шаги отменяются. Разбираем ошибку → решаем уравнение графическим способом → разбор решения → рефлексия.'}
                  </p>
                  <button
                    type="button"
                    onClick={onErrorBranch}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                  >
                    Перейти по новому маршруту
                    <Icon name="arrowRight" className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-rose-100/85">
                  Попробуй ещё раз — теперь ты знаешь, где искать ошибку.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {status === 'correct' && (
        <div className="anim-pop rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
              <Icon name="check" className="h-5 w-5" />
            </span>
            <div className="space-y-3">
              <p className="text-sm font-bold text-emerald-100">
                {revealed ? 'Разбор решения' : 'Верно!'}
              </p>
              <p className="text-sm leading-relaxed text-emerald-50/85">
                {revealed ? `Правильный ответ: ${step.answer}. ${step.explain}` : step.explain}
              </p>
              <button
                type="button"
                onClick={onSuccess}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-emerald-950 transition hover:bg-emerald-400"
              >
                {mode === 'retry' ? 'Дальше по маршруту' : 'Продолжить'}
                <Icon name="arrowRight" className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
