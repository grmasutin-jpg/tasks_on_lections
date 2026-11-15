import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import type { Feedback, Tone } from '@/lib/engine';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        'rounded-3xl border border-violet-100 bg-white/95 p-5 shadow-lg shadow-violet-100/50 sm:p-6',
        className,
      )}
    >
      {children}
    </section>
  );
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-300/50 hover:from-violet-500 hover:to-indigo-500',
  secondary: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100',
};

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

type BadgeTone = 'violet' | 'amber' | 'emerald' | 'rose' | 'fuchsia' | 'slate';

const BADGE: Record<BadgeTone, string> = {
  violet: 'bg-violet-100 text-violet-700',
  amber: 'bg-amber-100 text-amber-800',
  emerald: 'bg-emerald-100 text-emerald-700',
  rose: 'bg-rose-100 text-rose-700',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-700',
  slate: 'bg-slate-100 text-slate-600',
};

export function Badge({ tone = 'violet', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-bold', BADGE[tone])}>
      {children}
    </span>
  );
}

export function Toggle({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl bg-violet-50/70 p-4 ring-1 ring-violet-100"
    >
      <span>
        <span className="block font-semibold text-slate-800">{label}</span>
        {description && <span className="mt-1 block text-sm text-slate-500">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex h-7 w-12 shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-violet-600 peer-focus-visible:ring-4 peer-focus-visible:ring-violet-200" />
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm font-medium text-slate-600">
        <span>{label}</span>
        <span>{Math.round(v)}%</span>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full bg-violet-100"
        role="progressbar"
        aria-valuenow={Math.round(v)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700 ease-out"
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

const TONES: Record<Tone, { box: string; icon: string }> = {
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-900', icon: '✓' },
  error: { box: 'border-rose-200 bg-rose-50 text-rose-900', icon: '✕' },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-900', icon: '!' },
  info: { box: 'border-violet-200 bg-violet-50 text-violet-900', icon: 'i' },
};

export function FeedbackBox({ fb }: { fb: Feedback | null }) {
  if (!fb) return null;
  const t = TONES[fb.tone];
  return (
    <div role="status" aria-live="polite" className={cn('animate-pop rounded-2xl border p-4', t.box)}>
      <div className="flex gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/80 text-sm font-bold">
          {t.icon}
        </span>
        <div className="space-y-1">
          <p className="font-semibold">{fb.title}</p>
          <p className="text-sm leading-relaxed">{fb.message}</p>
          {fb.hint && <p className="text-sm font-medium">💡 {fb.hint}</p>}
        </div>
      </div>
    </div>
  );
}

export function RouteChips({ labels }: { labels: string[] }) {
  if (labels.length === 0) return <span className="text-sm text-slate-400">пока нет</span>;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {labels.map((l, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="rounded-lg bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-800 ring-1 ring-violet-100">
            {l}
          </span>
          {i < labels.length - 1 && <span className="text-slate-300">→</span>}
        </span>
      ))}
    </div>
  );
}
