import { useMemo, useState } from 'react';
import type { BalanceSpec } from '@/data/types';
import { Icon } from './Icon';

interface BalanceCardProps {
  spec: BalanceSpec;
  onComplete: () => void;
}

interface Term {
  id: string;
  label: string;
  side: 'L' | 'R';
}

const normalize = (label: string) => label.replace(/^\+/, '');

function formatSide(terms: Term[], side: 'L' | 'R') {
  const list = terms.filter((t) => t.side === side).map((t) => t.label);
  if (!list.length) return '0';
  return list.join(' + ').replace(/\+\s-/g, '− ');
}

export function BalanceCard({ spec, onComplete }: BalanceCardProps) {
  const [terms, setTerms] = useState<Term[]>(() => [
    ...spec.left.map((label, i) => ({ id: `l${i}`, label, side: 'L' as const })),
    ...spec.right.map((label, i) => ({ id: `r${i}`, label, side: 'R' as const })),
  ]);
  const [moves, setMoves] = useState(0);
  const [hintShown, setHintShown] = useState(false);

  const goalReached = useMemo(() => {
    const norm = (arr: string[]) => arr.map(normalize).sort().join('|');
    return (
      norm(terms.filter((t) => t.side === 'L').map((t) => t.label)) === norm(spec.targetLeft) &&
      norm(terms.filter((t) => t.side === 'R').map((t) => t.label)) === norm(spec.targetRight)
    );
  }, [terms, spec.targetLeft, spec.targetRight]);

  const flipSign = (label: string) => {
    if (label.startsWith('-')) return '+' + label.slice(1);
    if (label.startsWith('+')) return '-' + label.slice(1);
    return '-' + label;
  };

  const move = (id: string) => {
    setTerms((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, label: flipSign(t.label), side: t.side === 'L' ? 'R' : 'L' } : t,
      ),
    );
    setMoves((m) => m + 1);
  };

  const reset = () => {
    setTerms([
      ...spec.left.map((label, i) => ({ id: `l${i}`, label, side: 'L' as const })),
      ...spec.right.map((label, i) => ({ id: `r${i}`, label, side: 'R' as const })),
    ]);
    setMoves(0);
  };

  const left = terms.filter((t) => t.side === 'L');
  const right = terms.filter((t) => t.side === 'R');
  const tilt = Math.max(-7, Math.min(7, (left.length - right.length) * 2.5));

  return (
    <div className="anim-fade-up space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30">
          <Icon name="scale" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300/80">
            Наглядная модель
          </p>
          <h2 className="text-xl font-bold text-white">Весы: равновесие сохраняется</h2>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5">
        <svg viewBox="0 0 320 96" className="mx-auto h-24 w-full max-w-sm">
          <g style={{ transformOrigin: '160px 30px', transform: `rotate(${tilt}deg)` }}>
            <rect x="26" y="26" width="268" height="8" rx="4" fill="url(#beam)" />
            <defs>
              <linearGradient id="beam" x1="0" x2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <path d="M40 34v18" stroke="#fbbf24/70" strokeWidth="2" />
            <path d="M280 34v18" stroke="#fbbf24/70" strokeWidth="2" />
            <path d="M22 52h36" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
            <path d="M262 52h36" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
            <path d="M14 52h44l-6 16H20l-6-16Z" fill="#fbbf24/20" stroke="#fbbf24/70" strokeWidth="1.6" />
            <path d="M262 52h44l-6 16h-32l-6-16Z" fill="#fbbf24/20" stroke="#fbbf24/70" strokeWidth="1.6" />
          </g>
          <path d="M160 34 140 78h40l-20-44Z" fill="#94a3b8/25" stroke="#cbd5e1/50" strokeWidth="1.6" />
          <path d="M124 78h72" stroke="#cbd5e1/60" strokeWidth="3" strokeLinecap="round" />
        </svg>

        <p className="mt-2 text-center text-sm text-slate-400">{spec.caption}</p>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
          <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Левая часть
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {left.length === 0 && <span className="text-xs text-slate-500">пусто</span>}
            {left.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => move(t.id)}
                className="rounded-lg bg-indigo-500/20 px-3 py-1.5 font-mono text-base font-bold text-indigo-100 ring-1 ring-indigo-400/40 transition hover:bg-indigo-500/35 active:scale-95"
                title="Переложить на другую чашу"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-8 font-mono text-2xl font-bold text-slate-400">=</div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
          <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Правая часть
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {right.length === 0 && <span className="text-xs text-slate-500">пусто</span>}
            {right.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => move(t.id)}
                className="rounded-lg bg-emerald-500/20 px-3 py-1.5 font-mono text-base font-bold text-emerald-100 ring-1 ring-emerald-400/40 transition hover:bg-emerald-500/35 active:scale-95"
                title="Переложить на другую чашу"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-xl px-4 py-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Уравнение сейчас
        </p>
        <p className="mt-1.5 font-mono text-xl font-semibold text-white sm:text-2xl">
          {formatSide(terms, 'L')} = {formatSide(terms, 'R')}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 ring-1 ring-white/10">
          перекладываний: {moves}
        </span>
        <button
          type="button"
          onClick={() => setHintShown(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-400/10 px-3.5 py-2 text-xs font-semibold text-amber-200 ring-1 ring-amber-400/30 transition hover:bg-amber-400/20"
        >
          <Icon name="lightbulb" className="h-4 w-4" />
          Подсказка
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          <Icon name="rotate" className="h-4 w-4" />
          Сбросить
        </button>
      </div>

      {hintShown && (
        <p className="anim-fade-up rounded-xl border border-amber-300/20 bg-amber-300/8 px-4 py-3 text-sm leading-relaxed text-amber-100/90">
          Сначала переложи слагаемые с x влево (например, 2x станет −2x слева), затем переложи
          свободные числа вправо — у них тоже поменяется знак.
        </p>
      )}

      {goalReached && (
        <div className="anim-pop space-y-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <p className="text-sm font-bold text-emerald-100">Равновесие восстановлено!</p>
          <p className="text-sm leading-relaxed text-emerald-50/85">
            Все слагаемые с x собраны слева, числа — справа. Ровно так и работает перенос: то, что
            ушло с одной чаши, приходит на другую с обратным знаком.
          </p>
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-emerald-950 transition hover:bg-emerald-400"
          >
            Дальше по маршруту
            <Icon name="arrowRight" className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
