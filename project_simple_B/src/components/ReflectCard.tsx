import { useState } from 'react';
import type { Scenario } from '@/data/types';
import { Icon } from './Icon';

interface ReflectCardProps {
  scenario: Scenario;
  choice: string | null;
  text: string;
  onChange: (choice: string | null, text: string) => void;
  onComplete: () => void;
}

const KNOWLEDGE = {
  question: 'Верно ли: при переносе слагаемого на другую сторону знак меняется?',
  options: ['Да, всегда — так сохраняется равновесие', 'Нет, только у чисел', 'Знак не меняется никогда'],
  correct: 0,
};

export function ReflectCard({ scenario, choice, text, onChange, onComplete }: ReflectCardProps) {
  const [knowledge, setKnowledge] = useState<number | null>(null);

  return (
    <div className="anim-fade-up space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-500/15 text-pink-200 ring-1 ring-pink-400/30">
          <Icon name="heart" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-300/80">
            Рефлексия
          </p>
          <h2 className="text-xl font-bold text-white">Закрепим главное</h2>
        </div>
      </div>

      <div className="space-y-2.5">
        <p className="text-sm font-semibold text-white">Какой шаг дался сложнее всего?</p>
        <div className="flex flex-wrap gap-2">
          {scenario.steps.map((s) => {
            const active = choice === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange(s.id, text)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? 'bg-pink-500/25 text-pink-100 ring-1 ring-pink-400/50'
                    : 'bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10'
                }`}
              >
                {s.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5">
        <p className="text-sm font-semibold text-white">{KNOWLEDGE.question}</p>
        <div className="space-y-2">
          {KNOWLEDGE.options.map((opt, i) => {
            const active = knowledge === i;
            const isCorrect = knowledge !== null && i === KNOWLEDGE.correct;
            const isWrong = knowledge !== null && active && i !== KNOWLEDGE.correct;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setKnowledge(i)}
                className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                  isCorrect
                    ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-50'
                    : isWrong
                      ? 'border-rose-400/50 bg-rose-500/10 text-rose-50'
                      : 'border-white/10 bg-slate-950/30 text-slate-200 hover:border-white/25'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {knowledge !== null && (
          <p
            className={`anim-fade-up rounded-xl px-4 py-3 text-sm leading-relaxed ${
              knowledge === KNOWLEDGE.correct
                ? 'bg-emerald-500/10 text-emerald-100'
                : 'bg-amber-500/10 text-amber-100'
            }`}
          >
            {knowledge === KNOWLEDGE.correct
              ? 'Абсолютно верно: перенос — это добавление обратного слагаемого к обеим частям, поэтому знак меняется.'
              : 'Почти: правило работает для любого слагаемого — и чисел, и с переменной.'}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-white" htmlFor="reflect-text">
          Одним предложением: что нового ты понял?
        </label>
        <textarea
          id="reflect-text"
          value={text}
          onChange={(e) => onChange(choice, e.target.value)}
          rows={3}
          placeholder="Например: перенос — это не перемещение, а добавление с обратным знаком…"
          className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-pink-400/50 focus:ring-2 focus:ring-pink-400/30"
        />
      </div>

      <button
        type="button"
        onClick={onComplete}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-pink-900/40 transition hover:brightness-110 active:scale-[0.98]"
      >
        Завершить урок
        <Icon name="arrowRight" className="h-4 w-4" />
      </button>
    </div>
  );
}
