import { useState } from 'react';
import type { Drill } from '@/data/types';
import { checkAnswer } from '@/lib/answer';
import { Icon } from './Icon';

interface DrillCardProps {
  drills: Drill[];
  title?: string;
  subtitle?: string;
  onAttempt: (given: string, correct: boolean, expected: string) => void;
  onFail: () => void;
  onComplete: () => void;
  accent?: 'fuchsia' | 'violet';
}

export function DrillCard({
  drills,
  title = 'Микро-тренажёр',
  subtitle = 'Три коротких задания только на этот навык',
  onAttempt,
  onFail,
  onComplete,
  accent = 'fuchsia',
}: DrillCardProps) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'wrong' | 'ok' | 'revealed'>('idle');
  const [fails, setFails] = useState(0);
  const [done, setDone] = useState(false);

  const drill = drills[index];
  const isLast = index === drills.length - 1;

  const accentRing =
    accent === 'fuchsia'
      ? 'border-fuchsia-400/30 bg-fuchsia-500/10'
      : 'border-violet-400/30 bg-violet-500/10';
  const accentText = accent === 'fuchsia' ? 'text-fuchsia-200' : 'text-violet-200';

  const handleCheck = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim() || status === 'ok' || status === 'revealed') return;
    const correct = checkAnswer(value, drill.answer, drill.accepts);
    onAttempt(value, correct, drill.answer);
    if (correct) {
      setStatus('ok');
    } else {
      setStatus('wrong');
      setFails((f) => f + 1);
      onFail();
    }
  };

  const advance = () => {
    if (isLast) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setValue('');
      setStatus('idle');
      setFails(0);
    }
  };

  if (done) {
    return (
      <div className="anim-pop space-y-5 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30">
          <Icon name="check" className="h-7 w-7" />
        </span>
        <p className="text-lg font-bold text-white">Навык закреплён</p>
        <p className="text-sm leading-relaxed text-slate-300">
          Теперь можно вернуться к уравнению — этот шаг получится гораздо легче.
        </p>
        <button
          type="button"
          onClick={onComplete}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:brightness-110"
        >
          Вернуться к уравнению
          <Icon name="arrowRight" className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="anim-fade-up space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {drills.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition ${
                i < index
                  ? 'bg-emerald-400'
                  : i === index
                    ? 'bg-white'
                    : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      <div className={`rounded-2xl border px-5 py-5 ${accentRing}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/70">
          Задание {index + 1} из {drills.length}
        </p>
        <p className="mt-3 font-mono text-xl font-semibold text-white sm:text-2xl">{drill.prompt}</p>
      </div>

      <form onSubmit={handleCheck} className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (status === 'wrong') setStatus('idle');
            }}
            placeholder="ответ"
            autoComplete="off"
            spellCheck={false}
            className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3.5 font-mono text-lg text-white outline-none transition placeholder:font-sans placeholder:text-sm placeholder:text-slate-500 focus:ring-2 ${
              status === 'wrong'
                ? 'border-rose-400/60 focus:ring-rose-400/40'
                : status === 'ok' || status === 'revealed'
                  ? 'border-emerald-400/60 focus:ring-emerald-400/40'
                  : 'border-white/10 focus:border-fuchsia-400/60 focus:ring-fuchsia-400/40'
            }`}
          />
          <button
            type="submit"
            disabled={!value.trim() || status === 'ok' || status === 'revealed'}
            className="shrink-0 rounded-xl bg-gradient-to-br from-fuchsia-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Проверить
          </button>
        </div>
      </form>

      {status === 'wrong' && (
        <div className="anim-shake space-y-3 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4">
          <p className="text-sm font-semibold text-rose-100">Попробуй иначе</p>
          <p className="text-sm leading-relaxed text-rose-100/85">{drill.hint}</p>
          {fails >= 2 && (
            <button
              type="button"
              onClick={() => {
                setStatus('revealed');
                setValue(drill.answer);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
            >
              <Icon name="book" className="h-4 w-4" />
              Показать ответ
            </button>
          )}
        </div>
      )}

      {(status === 'ok' || status === 'revealed') && (
        <div className="anim-pop space-y-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <p className="text-sm font-bold text-emerald-100">
            {status === 'ok' ? 'Верно!' : 'Правильный ответ: ' + drill.answer}
          </p>
          <button
            type="button"
            onClick={advance}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-white transition ${accentText} bg-white/10 hover:bg-white/20`}
          >
            {isLast ? 'Навык закреплён' : 'Следующее задание'}
            <Icon name="arrowRight" className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
