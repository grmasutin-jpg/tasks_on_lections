import type { ReactNode } from 'react';
import { Badge, Button, Card, RouteChips, Toggle } from '@/components/ui';
import { STRATEGY_NAMES, summarize, type EventType, type RunState, type RunSummary, type Strategy } from '@/lib/engine';
import { EQUATION, MAIN_STEPS, SIM_WRONG_ANSWER } from '@/lib/scenario';
import type { ScenarioResult, Store } from '@/hooks/useMathPath';
import type { Navigate } from '@/hooks/useRoute';
import { cn } from '@/utils/cn';

interface Check {
  ok: boolean;
  title: string;
  detail: string;
}

const labels = (s: RunState) => s.route.map((e) => e.label).join(' → ');
const hasType = (s: RunState, t: EventType) => s.route.some((e) => e.type === t);
const countType = (s: RunState, t: EventType) => s.route.filter((e) => e.type === t).length;
const subtractError = (s: RunState) =>
  s.route.some((e) => e.type === 'error' && e.label === '2 ✗' && e.text.includes(SIM_WRONG_ANSWER));

function buildChecks(sc: ScenarioResult): Check[] {
  const r = sc.runs;
  const aOff = r['A-off'];
  const aOn = r['A-on'];
  const bOff = r['B-off'];
  const bOn = r['B-on'];
  return [
    {
      ok: aOff.phase === 'done' && aOff.errors === 0 && aOff.completed.length === MAIN_STEPS.length,
      title: '1. Стратегия A, симуляция выключена: все этапы без ошибок',
      detail: `Ученик проходит 4 этапа подряд. Ошибок: ${aOff.errors}. Маршрут: ${labels(aOff)}`,
    },
    {
      ok: aOn.phase === 'done' && aOn.errors === 1 && subtractError(aOn) && aOn.remedialEntries === 0,
      title: '2. Стратегия A, симуляция включена: задержка на этапе 2',
      detail:
        'Ответ 2x = 20 → подсказка «Вычтите 6 из обеих частей». Ученик остаётся на этапе 2, верный ответ 2x = 8 открывает этапы 3 и 4. Доп. этапов: 0.',
    },
    {
      ok: bOn.remedialEntries >= 1 && hasType(bOn, 'remedial_enter') && bOn.errors === 1 && subtractError(bOn),
      title: '3. Стратегия B, симуляция включена: переход на доп. этап',
      detail:
        'Ошибка 2x = 20 классифицирована как «обратные арифметические действия». Вместо повтора открыт дополнительный обучающий этап.',
    },
    {
      ok:
        bOn.phase === 'done' &&
        bOn.remedialDone.includes('inverse') &&
        countType(bOn, 'remedial_ok') === 2 &&
        hasType(bOn, 'return'),
      title: '4. Стратегия B: доп. задания выполнены и возврат к основной задаче',
      detail: `Выполнено дополнительных заданий: ${bOn.remedialCorrect}. Ученик вернулся к этапу 2 и решил уравнение. Итог: ${summarize(bOn).statusLabel}.`,
    },
    {
      ok: subtractError(aOn) && subtractError(bOn),
      title: '5. Одинаковые исходные данные и одинаковая ошибка',
      detail: `Оба прогона начинаются с уравнения ${EQUATION} и получают один и тот же ошибочный ответ ${SIM_WRONG_ANSWER} на этапе 2.`,
    },
    {
      ok: labels(aOn) !== labels(bOn),
      title: '6. Маршруты различаются',
      detail: 'Стратегия A повторяет этап 2, стратегия B проходит дополнительный этап и возвращается.',
    },
    {
      ok: labels(aOff) === labels(bOff) && bOff.remedialEntries === 0,
      title: '7. Без ошибки стратегии дают одинаковый маршрут',
      detail: 'Если симуляция выключена, адаптивный этап не активируется, поведение A и B совпадает.',
    },
  ];
}

function conclusion(a: RunSummary, b: RunSummary, simulate: boolean): string {
  const parts: string[] = [];
  parts.push(
    `Стратегия A: ошибок ${a.errors}, дополнительных заданий ${a.remedialTasksDone}. ${
      a.errors > 0
        ? 'Ученик остался на текущем этапе, получил подсказку и повторил действие.'
        : 'Маршрут прошёл без отклонений.'
    }`,
  );
  parts.push(
    `Стратегия B: ошибок ${b.errors}, открыто дополнительных этапов ${b.remedialModules}, выполнено заданий ${b.remedialTasksDone}. ${
      b.remedialModules > 0
        ? 'Система определила пробел в правиле, провела объяснение и вернула ученика к основному заданию.'
        : 'Дополнительный этап не понадобился.'
    }`,
  );
  parts.push(
    a.remedialModules === b.remedialModules && a.errors === b.errors
      ? 'Маршруты совпадают.'
      : 'Маршруты различаются: стратегия B строит обучение на основе ошибки, стратегия A — на повторе.',
  );
  if (!simulate) parts.push('Симуляция выключена, поэтому ошибок нет и различий в маршруте быть не должно.');
  return parts.join(' ');
}

function StrategyCard({ strategy, s, accent }: { strategy: Strategy; s: RunSummary; accent: string }) {
  const rows: { label: string; value: ReactNode }[] = [
    {
      label: 'Пройденные этапы',
      value: s.passedSteps.length ? (
        <div className="flex flex-wrap gap-1.5">
          {s.passedSteps.map((t) => (
            <Badge key={t} tone="emerald">
              ✓ {t}
            </Badge>
          ))}
        </div>
      ) : (
        <span className="text-sm text-slate-400">пока нет</span>
      ),
    },
    { label: 'Текущий этап', value: <span className="font-semibold text-slate-800">{s.currentStage}</span> },
    {
      label: 'Количество ошибок',
      value: <span className="text-2xl font-extrabold text-rose-600">{s.errors}</span>,
    },
    {
      label: 'Дополнительные задания',
      value: (
        <span className="text-sm text-slate-700">
          выполнено: <b>{s.remedialTasksDone}</b>, открыто доп. этапов: <b>{s.remedialModules}</b>
        </span>
      ),
    },
    {
      label: 'Итоговый статус',
      value: (
        <Badge tone={s.completed ? (s.errors === 0 ? 'emerald' : 'amber') : 'violet'}>{s.statusLabel}</Badge>
      ),
    },
  ];
  return (
    <Card className="relative overflow-hidden">
      <div className={cn('absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r', accent)} />
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Стратегия {strategy}</p>
      <h3 className="mt-1 text-xl font-bold text-slate-900">{STRATEGY_NAMES[strategy]}</h3>
      <dl className="mt-5 space-y-4">
        {rows.map((r) => (
          <div key={r.label} className="rounded-2xl bg-slate-50 p-4">
            <dt className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Маршрут</dt>
          <dd>
            <RouteChips labels={s.routeLabels} />
          </dd>
        </div>
      </dl>
    </Card>
  );
}

export default function Compare({ store, navigate }: { store: Store; navigate: Navigate }) {
  const { data, setSimulateCompare, runComparison, runScenario } = store;
  const cmp = data.compare;
  const sc = data.scenario;

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <p className="text-sm font-semibold text-violet-600">Страница сравнения</p>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Стратегии A и B</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Обе стратегии получают одинаковые исходные данные и одинаковые ответы ученика. Прогон выполняется тем же
          движком, что и обучение, поэтому различие маршрутов вызвано только правилами стратегии.
        </p>
      </div>

      <Card>
        <h2 className="font-bold text-slate-900">Исходные данные (одинаковые для обеих стратегий)</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-violet-50 p-4">
            <p className="text-xs font-semibold text-slate-500">Уравнение</p>
            <p className="mt-1 font-mono text-lg font-bold">{EQUATION}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-semibold text-slate-500">Верный ответ этапа 2</p>
            <p className="mt-1 font-mono text-lg font-bold">2x = 8</p>
          </div>
          <div className="rounded-2xl bg-fuchsia-50 p-4">
            <p className="text-xs font-semibold text-slate-500">Ошибка при симуляции</p>
            <p className="mt-1 font-mono text-lg font-bold">{SIM_WRONG_ANSWER}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <Toggle
            id="compare-simulate"
            checked={data.simulateCompare}
            onChange={setSimulateCompare}
            label="Симуляция ошибки в сравнении"
            description="Включите, чтобы на этапе 2 была ошибка 2x = 20 (этап — один и тот же для обеих стратегий)."
          />
          <div className="flex flex-wrap gap-3">
            <Button onClick={runComparison}>▶ Запустить обе стратегии</Button>
            <Button variant="secondary" onClick={runScenario}>
              ✔ Контрольный сценарий
            </Button>
          </div>
        </div>
      </Card>

      {cmp ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <StrategyCard
              strategy="A"
              s={summarize(cmp.runs.A)}
              accent="from-sky-500 to-cyan-500"
            />
            <StrategyCard
              strategy="B"
              s={summarize(cmp.runs.B)}
              accent="from-violet-500 to-fuchsia-500"
            />
          </div>
          <Card>
            <h2 className="font-bold text-slate-900">Вывод по результатам прогона</h2>
            <p className="mt-1 text-sm text-slate-500">
              Симуляция: {cmp.simulate ? 'включена' : 'выключена'}. Запуск: {new Date(cmp.at).toLocaleTimeString('ru-RU')}.
            </p>
            <p className="mt-3 leading-relaxed text-slate-700">
              {conclusion(summarize(cmp.runs.A), summarize(cmp.runs.B), cmp.simulate)}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => navigate('/learn')}>
                Пройти вручную на странице обучения
              </Button>
            </div>
          </Card>
        </>
      ) : (
        <Card className="text-center">
          <p className="text-slate-600">
            Нажмите «Запустить обе стратегии», чтобы увидеть маршруты рядом. Результат появится здесь.
          </p>
        </Card>
      )}

      {sc && <ScenarioPanel sc={sc} />}
    </div>
  );
}

function ScenarioPanel({ sc }: { sc: ScenarioResult }) {
  const checks = buildChecks(sc);
  const passed = checks.filter((c) => c.ok).length;
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Контрольный сценарий</h2>
          <p className="text-sm text-slate-500">
            Воспроизводимый прогон: A без ошибки, A с ошибкой, B с ошибкой, B без ошибки. Ошибка — 2x = 20.
          </p>
        </div>
        <Badge tone={passed === checks.length ? 'emerald' : 'amber'}>
          Проверок пройдено: {passed} из {checks.length}
        </Badge>
      </div>
      <ol className="mt-5 space-y-3">
        {checks.map((c) => (
          <li
            key={c.title}
            className={cn(
              'animate-fade-up flex gap-3 rounded-2xl border p-4',
              c.ok ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60',
            )}
          >
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
                c.ok ? 'bg-emerald-500' : 'bg-rose-500',
              )}
            >
              {c.ok ? '✓' : '✕'}
            </span>
            <div>
              <p className="font-semibold text-slate-900">{c.title}</p>
              <p className="text-sm text-slate-600">{c.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-6 space-y-3">
        <p className="text-sm font-semibold text-slate-700">Маршруты прогонов</p>
        {(['A-off', 'A-on', 'B-off', 'B-on'] as const).map((key) => (
          <div key={key} className="rounded-2xl bg-slate-50 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              {key.replace('-', ' · симуляция ')}
            </p>
            <RouteChips labels={summarize(sc.runs[key]).routeLabels} />
          </div>
        ))}
      </div>
    </Card>
  );
}
