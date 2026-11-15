import type { ReactNode } from 'react';
import { Badge, Button, Card, RouteChips } from '@/components/ui';
import { STRATEGY_NAMES, summarize, type RunState, type Strategy } from '@/lib/engine';
import type { Store } from '@/hooks/useMathPath';
import type { Navigate } from '@/hooks/useRoute';

function simLabel(s: RunState) {
  return s.simulate ? 'вкл.' : 'выкл.';
}

export default function Results({ store, navigate }: { store: Store; navigate: Navigate }) {
  const { data, restartRun, selectStrategy, clearStats } = store;
  const sums = { A: summarize(data.runs.A), B: summarize(data.runs.B) };
  const strategies: Strategy[] = ['A', 'B'];

  const metrics: { label: string; a: ReactNode; b: ReactNode }[] = [
    { label: 'Итоговый статус', a: sums.A.statusLabel, b: sums.B.statusLabel },
    { label: 'Правильных ответов', a: sums.A.correctAnswers, b: sums.B.correctAnswers },
    { label: 'Допущено ошибок', a: sums.A.errors, b: sums.B.errors },
    { label: 'Открыто дополнительных этапов', a: sums.A.remedialModules, b: sums.B.remedialModules },
    { label: 'Выполнено дополнительных заданий', a: sums.A.remedialTasksDone, b: sums.B.remedialTasksDone },
    {
      label: 'Пройдено основных этапов',
      a: `${sums.A.passedSteps.length} из ${sums.A.totalSteps}`,
      b: `${sums.B.passedSteps.length} из ${sums.B.totalSteps}`,
    },
  ];

  const history = data.history;
  const cmp = data.compare;

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-violet-600">Страница результатов</p>
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Итоги прохождения</h1>
          <p className="mt-1 text-slate-600">Текущие прохождения обеих стратегий и история завершённых запусков.</p>
        </div>
        <Button variant="danger" onClick={clearStats}>
          Очистить статистику
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {strategies.map((s) => {
          const run = data.runs[s];
          const sum = sums[s];
          return (
            <Card key={s}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Стратегия {s}</p>
                  <h2 className="text-xl font-bold text-slate-900">{STRATEGY_NAMES[s]}</h2>
                </div>
                <Badge tone={run.phase === 'done' ? 'emerald' : 'violet'}>
                  {run.phase === 'done' ? 'Пройдено' : 'В процессе'}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-500">Симуляция ошибки: {run.simulate ? 'включена' : 'выключена'}</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-center">
                  <p className="text-2xl font-extrabold text-emerald-600">{sum.correctAnswers}</p>
                  <p className="text-xs text-slate-600">верных</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-3 text-center">
                  <p className="text-2xl font-extrabold text-rose-600">{sum.errors}</p>
                  <p className="text-xs text-slate-600">ошибок</p>
                </div>
                <div className="rounded-2xl bg-violet-50 p-3 text-center">
                  <p className="text-2xl font-extrabold text-violet-600">{sum.remedialTasksDone}</p>
                  <p className="text-xs text-slate-600">доп. заданий</p>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-700">Пройденный маршрут</p>
              <div className="mt-2">
                <RouteChips labels={sum.routeLabels} />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  onClick={() => {
                    selectStrategy(s);
                    restartRun(s);
                    navigate('/learn');
                  }}
                >
                  Повторить прохождение
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    selectStrategy(s);
                    navigate('/learn');
                  }}
                >
                  Открыть обучение
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <h2 className="text-xl font-bold text-slate-900">Сравнение поведения стратегий</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-3 pr-4 font-semibold">Показатель</th>
                <th className="py-3 pr-4 font-semibold text-sky-700">Стратегия A</th>
                <th className="py-3 font-semibold text-violet-700">Стратегия B</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.label} className="border-b border-slate-100 align-top">
                  <td className="py-3 pr-4 font-medium text-slate-700">{m.label}</td>
                  <td className="py-3 pr-4 text-slate-900">{m.a}</td>
                  <td className="py-3 text-slate-900">{m.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {cmp && (
          <p className="mt-4 rounded-2xl bg-violet-50 p-4 text-sm text-violet-900">
            Последний контрольный прогон ({cmp.simulate ? 'с симуляцией' : 'без симуляции'}): A — ошибок{' '}
            {summarize(cmp.runs.A).errors}, доп. этапов {summarize(cmp.runs.A).remedialModules}; B — ошибок{' '}
            {summarize(cmp.runs.B).errors}, доп. этапов {summarize(cmp.runs.B).remedialModules}. Подробности — на странице
            «Сравнение».
          </p>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-slate-900">История завершённых прохождений</h2>
          <Badge tone="slate">Всего: {history.length}</Badge>
        </div>
        {history.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Пока нет завершённых прохождений. Решите уравнение на странице обучения — результат сохранится здесь.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Дата</th>
                  <th className="py-2 pr-3 font-semibold">Стратегия</th>
                  <th className="py-2 pr-3 font-semibold">Симуляция</th>
                  <th className="py-2 pr-3 font-semibold">Ошибок</th>
                  <th className="py-2 pr-3 font-semibold">Верных</th>
                  <th className="py-2 font-semibold">Статус</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const sm = summarize(h);
                  return (
                    <tr key={h.id} className="border-b border-slate-100">
                      <td className="py-2 pr-3 text-slate-600">
                        {new Date(h.finishedAt ?? h.startedAt).toLocaleString('ru-RU')}
                      </td>
                      <td className="py-2 pr-3 font-semibold">{h.strategy}</td>
                      <td className="py-2 pr-3">{simLabel(h)}</td>
                      <td className="py-2 pr-3">{sm.errors}</td>
                      <td className="py-2 pr-3">{sm.correctAnswers}</td>
                      <td className="py-2 text-slate-700">{sm.statusLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
