import { SKILLS } from '@/data/skills';
import type { Scenario, StrategyId } from '@/data/types';
import type { RunState } from '@/lib/run';
import { Icon, type IconName } from './Icon';

interface MetricsPanelProps {
  run: RunState;
  scenario: Scenario;
  strategy: StrategyId;
  elapsed: number;
}

const fmtTime = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

export function MetricsPanel({ run, scenario, strategy, elapsed }: MetricsPanelProps) {
  const { metrics } = run;

  const stats: { label: string; value: string; icon: IconName; tone: string }[] = [
    { label: 'Время', value: fmtTime(elapsed), icon: 'clock', tone: 'text-slate-200' },
    { label: 'Попытки', value: String(metrics.attempts), icon: 'target', tone: 'text-indigo-200' },
    { label: 'Ошибки', value: String(metrics.errors), icon: 'alert', tone: 'text-rose-200' },
    { label: 'Подсказки', value: String(metrics.hints), icon: 'lightbulb', tone: 'text-amber-200' },
    {
      label: 'Ветки',
      value: String(metrics.branches),
      icon: 'route',
      tone: metrics.branches > 0 ? 'text-violet-200' : 'text-slate-200',
    },
  ];

  const skillStats = scenario.steps.map((step) => {
    const rec = run.steps[step.id];
    return {
      skill: step.skill,
      title: SKILLS[step.skill].title,
      solved: rec?.solved ?? false,
      errors: rec?.errors ?? 0,
    };
  });

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="mb-3 flex items-center gap-2">
          <Icon name="chart" className="h-4 w-4 text-emerald-300" />
          <h3 className="text-sm font-bold text-white">Метрики</h3>
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${
              strategy === 'A'
                ? 'bg-violet-500/15 text-violet-200'
                : 'bg-emerald-500/15 text-emerald-200'
            }`}
          >
            Стратегия {strategy}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-white/[0.04] px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <Icon name={s.icon} className="h-3.5 w-3.5" />
                {s.label}
              </p>
              <p className={`mt-1 text-xl font-extrabold ${s.tone}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="mb-3 flex items-center gap-2">
          <Icon name="layers" className="h-4 w-4 text-sky-300" />
          <h3 className="text-sm font-bold text-white">Навыки сценария</h3>
        </div>
        <ul className="space-y-2.5">
          {skillStats.map((s) => (
            <li key={s.skill}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{s.title}</span>
                <span
                  className={`font-bold ${
                    s.solved ? 'text-emerald-300' : s.errors > 0 ? 'text-rose-300' : 'text-slate-400'
                  }`}
                >
                  {s.solved ? 'освоено' : s.errors > 0 ? `${s.errors} ошиб.` : 'не начато'}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    s.solved
                      ? 'bg-emerald-400'
                      : s.errors > 0
                        ? 'bg-rose-400/70'
                        : 'bg-white/20'
                  }`}
                  style={{ width: s.solved ? '100%' : s.errors > 0 ? '45%' : '8%' }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
