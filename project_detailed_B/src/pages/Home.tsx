import { Button, Card } from '@/components/ui';
import { EQUATION, MAIN_STEPS, SIM_WRONG_ANSWER, STATES } from '@/lib/scenario';
import type { Navigate } from '@/hooks/useRoute';

const STRATEGY_CARDS = [
  {
    letter: 'A',
    title: 'Последовательное обучение',
    accent: 'from-sky-500 to-cyan-500',
    points: [
      'Этапы проходятся строго по порядку.',
      'При ошибке ученик получает подсказку.',
      'Он остаётся на том же этапе и повторяет действие.',
      'Следующий этап откроется только после верного ответа.',
    ],
  },
  {
    letter: 'B',
    title: 'Адаптивное обучение',
    accent: 'from-violet-500 to-fuchsia-500',
    points: [
      'Те же этапы и те же исходные данные.',
      'Система определяет, какое правило не усвоено.',
      'Открывается короткое объяснение и 2 дополнительных задания.',
      'После успешного выполнения ученик возвращается к исходной задаче.',
    ],
  },
];

export default function Home({ navigate }: { navigate: Navigate }) {
  return (
    <div className="animate-fade-up space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 p-8 text-white shadow-xl shadow-violet-300/50 sm:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-fuchsia-300/20 blur-2xl" />
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-200">Образовательный тренажёр</p>
        <h1 className="mt-3 text-5xl font-extrabold tracking-tight sm:text-6xl">MathPath</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-violet-100">
          Учимся решать линейные уравнения шаг за шагом. Здесь важен не только ответ: каждый этап проверяется,
          ошибки разбираются, а маршрут обучения зависит от того, какое правило пока не освоено.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/learn')}
            className="rounded-2xl bg-white px-6 py-3 font-semibold text-violet-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-violet-50"
          >
            Начать обучение
          </button>
          <button
            type="button"
            onClick={() => navigate('/compare')}
            className="rounded-2xl bg-white/15 px-6 py-3 font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/25"
          >
            Сравнить стратегии
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <p className="text-sm font-semibold text-violet-600">Учебный сценарий</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Решить уравнение</h2>
          <div className="mt-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-5 text-center">
            <p className="font-mono text-4xl font-bold text-slate-900">{EQUATION}</p>
          </div>
          <ol className="mt-5 space-y-3">
            {MAIN_STEPS.map((st, i) => (
              <li key={st.id} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-slate-800">{st.title}</p>
                  <p className="font-mono text-sm text-slate-500">
                    {i === 3 ? '2(4 + 3) = 14' : STATES[i + 1] ?? 'x = 4'}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-5 rounded-2xl bg-fuchsia-50 p-3 text-sm text-fuchsia-900">
            Симуляция ошибки: на этапе 2 вместо «2x = 8» вводится <b className="font-mono">{SIM_WRONG_ANSWER}</b>{' '}
            (6 прибавили вместо вычитания).
          </p>
        </Card>

        <div className="grid gap-6">
          {STRATEGY_CARDS.map((s) => (
            <Card key={s.letter} className="relative overflow-hidden">
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${s.accent}`} />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Стратегия {s.letter}</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">{s.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {s.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-violet-500">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Как проверить разницу за минуту</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: '1', t: 'Пройдите обучение', d: 'Выберите стратегию A, выключите симуляцию и решите уравнение до конца.' },
            { n: '2', t: 'Включите ошибку', d: 'Включите симуляцию и проверьте этап 2: сравните поведение стратегий A и B.' },
            { n: '3', t: 'Сравните маршруты', d: 'На странице «Сравнение» запустите обе стратегии с одинаковыми данными и посмотрите результаты.' },
          ].map((x) => (
            <Card key={x.n} className="p-5!">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 font-bold text-violet-700">
                {x.n}
              </span>
              <p className="mt-3 font-bold text-slate-900">{x.t}</p>
              <p className="mt-1 text-sm text-slate-600">{x.d}</p>
            </Card>
          ))}
        </div>
        <div className="mt-6">
          <Button variant="secondary" onClick={() => navigate('/results')}>
            Перейти к результатам
          </Button>
        </div>
      </section>
    </div>
  );
}
