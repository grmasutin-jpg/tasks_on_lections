import { useMemo } from 'react';
import type { Scenario, StrategyId } from '@/data/types';
import { buildRoute, branchPreview, NODE_META, STRATEGIES } from '@/lib/route';
import type { RunState } from '@/lib/run';
import type { RunSummary } from '@/lib/storage';
import { Icon, type IconName } from './Icon';

interface ReportCardProps {
  run: RunState;
  scenario: Scenario;
  otherSummary: RunSummary | null;
  onRestart: () => void;
  onSwitchStrategy: () => void;
  onNewScenario: () => void;
}

const fmtTime = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

export function ReportCard({
  run,
  scenario,
  otherSummary,
  onRestart,
  onSwitchStrategy,
  onNewScenario,
}: ReportCardProps) {
  const route = useMemo(() => buildRoute(scenario, run.strategy), [scenario, run.strategy]);
  const otherStrategy: StrategyId = run.strategy === 'A' ? 'B' : 'A';
  const otherRoute = useMemo(
    () => (otherSummary ? buildRoute(scenario, otherSummary.strategy) : null),
    [otherSummary, scenario],
  );
  const duration =
    (run.metrics.finishedAt ?? Date.now()) - run.metrics.startedAt;

  const stats: { label: string; value: string; icon: IconName }[] = [
    { label: 'Время', value: fmtTime(duration), icon: 'clock' },
    { label: 'Попытки', value: String(run.metrics.attempts), icon: 'target' },
    { label: 'Ошибки', value: String(run.metrics.errors), icon: 'alert' },
    { label: 'Подсказки', value: String(run.metrics.hints), icon: 'lightbulb' },
    { label: 'Ветки маршрута', value: String(run.metrics.branches), icon: 'route' },
    { label: 'Узлов пройдено', value: String(run.visited.length), icon: 'layers' },
  ];

  return (
    <div className="anim-fade-up space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/15 via-slate-900/40 to-indigo-500/10 p-6 sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/40">
            <Icon name="trophy" className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
              Урок пройден
            </p>
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              Корень: {scenario.root}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {scenario.title} · стратегия «{STRATEGIES[run.strategy].name}»
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl px-4 py-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <Icon name={s.icon} className="h-3.5 w-3.5" />
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <Icon name="route" className="h-4 w-4 text-indigo-300" />
          Твой маршрут
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {run.visited.map((id, i) => {
            const node = route[id];
            if (!node) return null;
            const meta = NODE_META[node.kind];
            return (
              <div key={id + i} className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${meta.bg} ${meta.color} ring-1 ${meta.ring}`}
                >
                  <Icon name={meta.icon as IconName} className="h-3.5 w-3.5" />
                  {node.title}
                </span>
                {i < run.visited.length - 1 && (
                  <Icon name="arrowRight" className="h-3.5 w-3.5 text-slate-600" />
                )}
              </div>
            );
          })}
        </div>
        {run.metrics.branches > 0 && (
          <p className="mt-3 rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm leading-relaxed text-violet-100">
            Ошибка изменила маршрут: сработала ветка «{STRATEGIES[run.strategy].name}» —{' '}
            {STRATEGIES[run.strategy].onError}
          </p>
        )}
      </div>

      {run.wrong.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <Icon name="alert" className="h-4 w-4 text-rose-300" />
            Разбор ошибок
          </h3>
          <ul className="mt-3 space-y-2">
            {run.wrong.map((w, i) => (
              <li
                key={i}
                className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {w.title}
                </p>
                <p className="mt-1.5 font-mono text-sm text-rose-200">было: {w.given}</p>
                <p className="font-mono text-sm text-emerald-200">стало: {w.expected}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="glass rounded-2xl p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <Icon name="layers" className="h-4 w-4 text-cyan-300" />
          Сравнение стратегий
        </h3>

        {otherSummary && otherRoute ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(
              [
                { strategy: run.strategy, summary: null, visited: run.visited },
                { strategy: otherStrategy, summary: otherSummary, visited: otherSummary.visited },
              ] as const
            ).map((col) => {
              const summary = col.summary;
              const colRoute = summary ? otherRoute! : route;
              const errors = summary ? summary.errors : run.metrics.errors;
              const hints = summary ? summary.hints : run.metrics.hints;
              const branches = summary ? summary.branches : run.metrics.branches;
              const durationMs = summary
                ? summary.durationMs
                : (run.metrics.finishedAt ?? Date.now()) - run.metrics.startedAt;
              return (
                <div
                  key={col.strategy}
                  className={`rounded-2xl border p-4 ${
                    col.strategy === run.strategy
                      ? 'border-indigo-400/30 bg-indigo-500/5'
                      : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Стратегия {col.strategy}
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {STRATEGIES[col.strategy].name}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-white/5 px-2 py-2">
                      <p className="text-[10px] uppercase text-slate-400">ошибки</p>
                      <p className="text-lg font-extrabold text-white">{errors}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 px-2 py-2">
                      <p className="text-[10px] uppercase text-slate-400">подсказки</p>
                      <p className="text-lg font-extrabold text-white">{hints}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 px-2 py-2">
                      <p className="text-[10px] uppercase text-slate-400">узлов</p>
                      <p className="text-lg font-extrabold text-white">{col.visited.length}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {col.visited.map((id, i) => {
                      const node = colRoute[id];
                      if (!node) return null;
                      const meta = NODE_META[node.kind];
                      return (
                        <span
                          key={id + i}
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${meta.bg} ${meta.color}`}
                          title={node.title}
                        >
                          {meta.label}
                        </span>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">
                    Время: {fmtTime(durationMs)} · веток восстановления: {branches}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm leading-relaxed text-slate-300">
              Ты прошёл сценарий по стратегии «{STRATEGIES[run.strategy].name}». Если бы на этой же
              ошибке ты выбрал стратегию «{STRATEGIES[otherStrategy].name}», маршрут пошёл бы так:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {branchPreview(otherStrategy).map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-400/30">
                    {label}
                  </span>
                  {i < branchPreview(otherStrategy).length - 1 && (
                    <Icon name="arrowRight" className="h-3.5 w-3.5 text-slate-600" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Пройди сценарий ещё раз по второй стратегии — в отчёте появится сравнение двух
              маршрутов.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 transition hover:brightness-110 active:scale-[0.98]"
        >
          <Icon name="rotate" className="h-4 w-4" />
          Пройти заново
        </button>
        <button
          type="button"
          onClick={onSwitchStrategy}
          className="inline-flex items-center gap-2 rounded-xl bg-white/8 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/15"
        >
          <Icon name="layers" className="h-4 w-4" />
          Другая стратегия
        </button>
        <button
          type="button"
          onClick={onNewScenario}
          className="inline-flex items-center gap-2 rounded-xl bg-white/8 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/15"
        >
          <Icon name="target" className="h-4 w-4" />
          Другой сценарий
        </button>
      </div>
    </div>
  );
}
