import type { SkillInfo } from '@/data/types';
import { Icon } from './Icon';

interface ConceptCardProps {
  skill: SkillInfo;
  onComplete: () => void;
}

export function ConceptCard({ skill, onComplete }: ConceptCardProps) {
  return (
    <div className="anim-fade-up space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/30">
          <Icon name="book" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300/80">
            Правило
          </p>
          <h2 className="text-xl font-bold text-white">{skill.title}</h2>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="border-b border-white/10 bg-violet-500/10 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200/70">
            Шпаргалка
          </p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {skill.rule}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-slate-200">{skill.body}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Icon name="route" className="h-4 w-4 text-indigo-300" />
          Что будет дальше
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Сейчас ты разобрал правило. Дальше — микро-тренажёр: три коротких задания только на этот
          навык, потом вернёмся к шагу и решим его заново.
        </p>
      </div>

      <button
        type="button"
        onClick={onComplete}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110 active:scale-[0.98]"
      >
        Понятно, пробуем
        <Icon name="arrowRight" className="h-4 w-4" />
      </button>
    </div>
  );
}
