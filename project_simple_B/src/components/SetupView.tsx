import { SCENARIOS } from '@/data/scenarios';
import type { Scenario, StrategyId } from '@/data/types';
import { STRATEGIES } from '@/lib/route';
import type { RunSummary } from '@/lib/storage';
import { Icon, type IconName } from './Icon';

interface SetupViewProps {
  scenarioId: string;
  strategy: StrategyId;
  history: RunSummary[];
  onScenario: (id: string) => void;
  onStrategy: (s: StrategyId) => void;
  onStart: () => void;
}

const difficultyTone: Record<Scenario['difficulty'], string> = {
  Легко: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30',
  Средне: 'bg-amber-500/15 text-amber-200 ring-amber-400/30',
  Сложно: 'bg-rose-500/15 text-rose-200 ring-rose-400/30',
};

export function SetupView({
  scenarioId,
  strategy,
  history,
  onScenario,
  onStrategy,
  onStart,
}: SetupViewProps) {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:py-14">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/20 via-slate-900/40 to-fuchsia-500/10 p-7 sm:p-10">
        <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-10 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3.5 py-1.5 text-xs font-semibold text-indigo-200 ring-1 ring-white/15">
            <Icon name="sparkles" className="h-4 w-4" />
            Интерактивный тренажёр по уравнениям
          </div>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            MathPath
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Решай уравнения по шагам. Один и тот же сценарий — две стратегии обучения: ошибка на
            промежуточном шаге ведёт в{' '}
            <span className="font-semibold text-violet-200">разбор навыка</span> или в{' '}
            <span className="font-semibold text-emerald-200">смену метода</span>. Маршрут каждый раз
            строится по-своему.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-900/50 transition hover:brightness-110 active:scale-[0.98]"
            >
              <Icon name="play" className="h-4 w-4" />
              Начать: {scenario.title}
            </button>
            <span className="font-mono text-sm text-slate-400">{scenario.equation}</span>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle
          icon="route"
          title="Две стратегии на одном сценарии"
          hint="Выбери, как ты будешь учиться — дальше маршрут будет зависеть от твоих ответов."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {(['A', 'B'] as StrategyId[]).map((id) => {
            const s = STRATEGIES[id];
            const active = strategy === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onStrategy(id)}
                className={`group relative overflow-hidden rounded-3xl border p-6 text-left transition ${
                  active
                    ? 'border-white/25 bg-gradient-to-br ' + s.accent + ' shadow-2xl'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`inline-flex h-10 items-center rounded-xl px-3 text-sm font-extrabold ${
                        id === 'A'
                          ? 'bg-violet-500/20 text-violet-100 ring-1 ring-violet-400/40'
                          : 'bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/40'
                      }`}
                    >
                      Стратегия {id}
                    </span>
                    <h3 className={`mt-3 text-2xl font-extrabold ${s.color}`}>{s.name}</h3>
                    <p className="text-sm text-slate-300">{s.tagline}</p>
                  </div>
                  <span
                    className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-2 transition ${
                      active
                        ? 'bg-white text-slate-900'
                        : 'border border-white/25 text-transparent group-hover:border-white/50'
                    }`}
                  >
                    <Icon name="check" className="h-4 w-4" />
                  </span>
                </div>

                <ul className="mt-4 space-y-2">
                  {s.idea.map((line, i) => (
                    <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-300">
                      <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/70" />
                      {line}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <Icon name="alert" className="h-3.5 w-3.5" />
                    Если ошибся на промежуточном шаге
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {s.errorRoute.map((label, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                            id === 'A'
                              ? 'bg-violet-500/15 text-violet-100 ring-1 ring-violet-400/30'
                              : 'bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-400/30'
                          }`}
                        >
                          {label}
                        </span>
                        {i < s.errorRoute.length - 1 && (
                          <Icon name="arrowRight" className="h-3.5 w-3.5 text-slate-600" />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">{s.onError}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle
          icon="route"
          title="Как ошибка меняет маршрут"
          hint="Одна и та же ошибка — два разных продолжения. Сравни, куда ведёт каждая стратегия."
        />
        <div className="glass rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 ring-1 ring-white/10">
              Шаг 1
            </span>
            <Icon name="arrowRight" className="h-4 w-4 text-slate-600" />
            <span className="rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 ring-1 ring-white/10">
              Шаг 2
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-200 ring-1 ring-rose-400/30">
              <Icon name="alert" className="h-3.5 w-3.5" />
              ошибка
            </span>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {(['A', 'B'] as StrategyId[]).map((id) => (
              <div
                key={id}
                className={`rounded-2xl border-l-[3px] bg-slate-950/30 p-5 ${
                  id === 'A' ? 'border-violet-400/60' : 'border-emerald-400/60'
                }`}
              >
                <p
                  className={`text-sm font-extrabold uppercase tracking-wider ${
                    id === 'A' ? 'text-violet-200' : 'text-emerald-200'
                  }`}
                >
                  Стратегия {id} · {STRATEGIES[id].name}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {STRATEGIES[id].errorRoute.map((label, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                          id === 'A'
                            ? 'bg-violet-500/15 text-violet-100 ring-1 ring-violet-400/30'
                            : 'bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-400/30'
                        }`}
                      >
                        {label}
                      </span>
                      {i < STRATEGIES[id].errorRoute.length - 1 && (
                        <Icon name="arrowRight" className="h-3.5 w-3.5 text-slate-600" />
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  {id === 'A'
                    ? 'Маршрут удлиняется: возвращаемся к шагу, но учимся на нём заново — с правилом, микро-задачами и весами.'
                    : 'Маршрут меняется методом: алгебраические шаги отменяются, уравнение решается графиком.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionTitle
          icon="target"
          title="Выбери сценарий"
          hint="У каждого сценария четыре шага и свои типичные ошибки."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {SCENARIOS.map((sc) => {
            const active = sc.id === scenarioId;
            const done = history.filter((h) => h.scenarioId === sc.id).length;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => onScenario(sc.id)}
                className={`rounded-2xl border p-5 text-left transition ${
                  active
                    ? 'border-indigo-400/50 bg-indigo-500/10 shadow-lg shadow-indigo-950/40'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-white">{sc.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{sc.topic}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${difficultyTone[sc.difficulty]}`}
                  >
                    {sc.difficulty}
                  </span>
                </div>
                <p className="mt-4 rounded-xl bg-slate-950/50 px-3.5 py-2.5 font-mono text-sm text-white">
                  {sc.equation}
                </p>
                <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                  <span>{sc.steps.length} шага</span>
                  <span>·</span>
                  <span>корень {sc.root}</span>
                  {done > 0 && (
                    <span className="ml-auto rounded bg-white/10 px-2 py-0.5 text-slate-300">
                      пройдено: {done}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: 'user' as IconName,
            title: '1. Решаешь по шагам',
            text: 'Каждый шаг — одно маленькое действие: раскрыть скобки, перенести слагаемое, разделить.',
          },
          {
            icon: 'alert' as IconName,
            title: '2. Ошибаешься — и это нормально',
            text: 'Ошибка не считается провалом: она перестраивает маршрут обучения.',
          },
          {
            icon: 'route' as IconName,
            title: '3. Видишь, как изменился путь',
            text: 'Карта маршрута показывает, где ты свернул и почему маршрут стал другим.',
          },
        ].map((item) => (
          <div key={item.title} className="glass rounded-2xl p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-indigo-200 ring-1 ring-white/10">
              <Icon name={item.icon} className="h-5 w-5" />
            </span>
            <p className="mt-3 font-bold text-white">{item.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{item.text}</p>
          </div>
        ))}
      </section>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-7 py-4 text-base font-bold text-white shadow-xl shadow-indigo-900/50 transition hover:brightness-110 active:scale-[0.98]"
        >
          <Icon name="play" className="h-5 w-5" />
          Начать тренировку
        </button>
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  hint,
}: {
  icon: IconName;
  title: string;
  hint: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2 text-xl font-extrabold text-white sm:text-2xl">
        <Icon name={icon} className="h-5 w-5 text-indigo-300" />
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-400">{hint}</p>
    </div>
  );
}
