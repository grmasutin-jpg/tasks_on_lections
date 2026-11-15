import { useState } from 'react';
import { Icon } from './Icon';

interface DemoCardProps {
  lines: string[];
  onComplete: () => void;
}

export function DemoCard({ lines, onComplete }: DemoCardProps) {
  const [shown, setShown] = useState(1);

  return (
    <div className="anim-fade-up space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-200 ring-1 ring-teal-400/30">
          <Icon name="sparkles" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300/80">
            Разбор решения
          </p>
          <h2 className="text-xl font-bold text-white">Смотри, как это работает</h2>
        </div>
      </div>

      <div className="glass space-y-2 rounded-2xl p-5">
        {lines.slice(0, shown).map((line, i) => (
          <p
            key={i}
            className="anim-fade-up font-mono text-base leading-relaxed text-white sm:text-lg"
          >
            {line}
          </p>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {shown < lines.length ? (
          <button
            type="button"
            onClick={() => setShown((s) => Math.min(lines.length, s + 1))}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:brightness-110"
          >
            Следующий шаг
            <Icon name="arrowRight" className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:brightness-110"
          >
            К рефлексии
            <Icon name="arrowRight" className="h-4 w-4" />
          </button>
        )}
        <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 ring-1 ring-white/10">
          {shown} / {lines.length}
        </span>
      </div>
    </div>
  );
}
