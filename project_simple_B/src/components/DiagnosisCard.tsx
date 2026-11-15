import { useState } from 'react';
import type { SkillInfo } from '@/data/types';
import { Icon } from './Icon';

interface DiagnosisCardProps {
  skill: SkillInfo;
  onComplete: () => void;
}

export function DiagnosisCard({ skill, onComplete }: DiagnosisCardProps) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="anim-fade-up space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30">
          <Icon name="stethoscope" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300/80">
            Диагностика
          </p>
          <h2 className="text-xl font-bold text-white">Что именно сломалось?</h2>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-slate-200">
        Выбери версию, которая ближе к тому, что ты сделал. Это не оценка — это способ понять
        причину. После разбора мы решим уравнение другим способом: графиком.
      </p>

      <div className="space-y-2.5">
        {skill.mistakes.map((m, i) => {
          const active = selected === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                active
                  ? 'border-rose-400/50 bg-rose-500/10'
                  : 'border-white/10 bg-slate-950/30 hover:border-white/25 hover:bg-white/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    active ? 'bg-rose-400 text-rose-950' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {active ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{m.text}</p>
                  {active && (
                    <p className="anim-fade-up mt-2 text-sm leading-relaxed text-rose-100/85">
                      {m.explanation}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-200">
          <Icon name="route" className="h-4 w-4" />
          Маршрут Б меняется
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Алгебраические шаги после этой ошибки отменяются. Дальше: графический метод → разбор
          решения → рефлексия. Иногда увидеть уравнение целиком полезнее, чем продолжать
          преобразования.
        </p>
      </div>

      <button
        type="button"
        disabled={selected === null}
        onClick={onComplete}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
      >
        {selected === null ? 'Выбери вариант' : 'Решим графиком'}
        <Icon name="arrowRight" className="h-4 w-4" />
      </button>
    </div>
  );
}
