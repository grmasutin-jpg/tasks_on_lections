import { useState } from 'react';
import type { ScenarioStep } from '@/data/types';
import { Icon } from './Icon';

interface JustifyCardProps {
  step: ScenarioStep;
  onAttempt: (given: string, correct: boolean, expected: string) => void;
  onComplete: () => void;
}

export function JustifyCard({ step, onAttempt, onComplete }: JustifyCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(false);

  const choose = (i: number) => {
    if (correct) return;
    setSelected(i);
    const ok = i === step.justify.correct;
    setCorrect(ok);
    onAttempt(step.justify.options[i], ok, step.justify.options[step.justify.correct]);
  };

  return (
    <div className="anim-fade-up space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/30">
          <Icon name="brain" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
            Обоснуй выбор
          </p>
          <h2 className="text-xl font-bold text-white">Почему это верно?</h2>
        </div>
      </div>

      <p className="text-base font-medium leading-relaxed text-white">{step.justify.question}</p>

      <div className="space-y-2.5">
        {step.justify.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = correct && i === step.justify.correct;
          const isWrongPick = isSelected && !correct;
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              className={`w-full rounded-2xl border p-4 text-left text-sm transition ${
                isCorrect
                  ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-50'
                  : isWrongPick
                    ? 'border-rose-400/50 bg-rose-500/10 text-rose-50'
                    : 'border-white/10 bg-slate-950/30 text-slate-200 hover:border-white/25 hover:bg-white/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isCorrect
                      ? 'bg-emerald-400 text-emerald-950'
                      : isWrongPick
                        ? 'bg-rose-400 text-rose-950'
                        : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {isCorrect ? (
                    <Icon name="check" className="h-3.5 w-3.5" />
                  ) : isWrongPick ? (
                    <Icon name="x" className="h-3.5 w-3.5" />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                <span className="leading-relaxed">{opt}</span>
              </div>
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div
          className={`anim-pop space-y-3 rounded-2xl border p-4 ${
            correct
              ? 'border-emerald-400/30 bg-emerald-500/10'
              : 'border-amber-400/30 bg-amber-500/10'
          }`}
        >
          <p className={`text-sm font-bold ${correct ? 'text-emerald-100' : 'text-amber-100'}`}>
            {correct ? 'Верно!' : 'Подумай ещё раз'}
          </p>
          <p className={`text-sm leading-relaxed ${correct ? 'text-emerald-50/85' : 'text-amber-50/85'}`}>
            {correct
              ? step.justify.feedback
              : 'Это не тот случай. Перечитай правило и выбери другой вариант — обоснование так же важно, как сам ответ.'}
          </p>
          {correct && (
            <button
              type="button"
              onClick={onComplete}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-emerald-950 transition hover:bg-emerald-400"
            >
              Следующий шаг
              <Icon name="arrowRight" className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
