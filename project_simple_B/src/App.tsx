import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { BalanceCard } from '@/components/BalanceCard';
import { ConceptCard } from '@/components/ConceptCard';
import { DemoCard } from '@/components/DemoCard';
import { DiagnosisCard } from '@/components/DiagnosisCard';
import { DrillCard } from '@/components/DrillCard';
import { GraphCard } from '@/components/GraphCard';
import { Icon, type IconName } from '@/components/Icon';
import { JustifyCard } from '@/components/JustifyCard';
import { MetricsPanel } from '@/components/MetricsPanel';
import { ReflectCard } from '@/components/ReflectCard';
import { ReportCard } from '@/components/ReportCard';
import { RouteMap } from '@/components/RouteMap';
import { SetupView } from '@/components/SetupView';
import { StepCard } from '@/components/StepCard';
import { SCENARIOS, getScenario } from '@/data/scenarios';
import { SKILLS } from '@/data/skills';
import type { Scenario, StrategyId } from '@/data/types';
import { createRun, runReducer } from '@/lib/run';
import { branchAfterError, buildRoute, NODE_META, STRATEGIES } from '@/lib/route';
import { latestFor, loadHistory, saveRunSummary, type RunSummary } from '@/lib/storage';

export default function App() {
  const [view, setView] = useState<'setup' | 'train'>('setup');
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [strategy, setStrategy] = useState<StrategyId>('A');
  const [run, dispatch] = useReducer(runReducer, undefined, () => createRun(SCENARIOS[0].id, 'A'));
  const [history, setHistory] = useState<RunSummary[]>(() => loadHistory());
  const [now, setNow] = useState(() => Date.now());
  const savedRef = useRef(false);

  const scenario = useMemo(() => getScenario(scenarioId), [scenarioId]);
  const route = useMemo(() => buildRoute(scenario, strategy), [scenario, strategy]);
  const node = route[run.current];

  useEffect(() => {
    if (view !== 'train') return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [view]);

  const elapsed = now - run.metrics.startedAt;

  const go = useCallback((nodeId: string) => {
    dispatch({ type: 'goto', nodeId });
    setNow(Date.now());
  }, []);

  const startRun = useCallback(
    (nextStrategy?: StrategyId, nextScenario?: string) => {
      const s = nextStrategy ?? strategy;
      const sc = nextScenario ?? scenarioId;
      dispatch({ type: 'start', scenarioId: sc, strategy: s });
      savedRef.current = false;
      setNow(Date.now());
      setView('train');
    },
    [scenarioId, strategy],
  );

  // Сохраняем результат забега, чтобы можно было сравнить стратегии.
  useEffect(() => {
    if (run.current !== 'finish' || savedRef.current) return;
    savedRef.current = true;
    const summary: RunSummary = {
      scenarioId: run.scenarioId,
      strategy: run.strategy,
      visited: run.visited,
      errors: run.metrics.errors,
      hints: run.metrics.hints,
      branches: run.metrics.branches,
      durationMs: (run.metrics.finishedAt ?? Date.now()) - run.metrics.startedAt,
      finishedAt: Date.now(),
    };
    setHistory(saveRunSummary(summary));
    dispatch({ type: 'finish' });
  }, [run.current, run.scenarioId, run.strategy, run.visited, run.metrics]);

  const onStepSubmit = useCallback(
    (nodeId: string, given: string, correct: boolean, expected: string, stepId?: string) => {
      dispatch({
        type: 'attempt',
        nodeId,
        title: node?.title ?? 'Шаг',
        given,
        expected,
        correct,
        stepId,
      });
    },
    [node],
  );

  const otherStrategy: StrategyId = strategy === 'A' ? 'B' : 'A';
  const otherSummary = useMemo(
    () => latestFor(history, scenarioId, otherStrategy) ?? null,
    [history, scenarioId, otherStrategy],
  );

  const stepRecord = node?.stepId ? run.steps[node.stepId] : undefined;
  const stepsDone = Object.values(run.steps).filter((s) => s.solved).length;

  const renderNode = () => {
    if (!node) return null;
    const step = node.stepId ? scenario.steps.find((s) => s.id === node.stepId) : undefined;

    switch (node.kind) {
      case 'intro':
        return (
          <IntroPanel
            scenario={scenario}
            strategy={strategy}
            onStart={() => go(node.next!)}
          />
        );

      case 'step':
      case 'retry': {
        if (!step) return null;
        const index = scenario.steps.findIndex((s) => s.id === step.id) + 1;
        return (
          <StepCard
            step={step}
            index={index}
            total={scenario.steps.length}
            strategy={strategy}
            mode={node.kind === 'retry' ? 'retry' : 'step'}
            hintsUsed={stepRecord?.hints ?? 0}
            failCount={stepRecord?.errors ?? 0}
            onHint={() => dispatch({ type: 'hint', nodeId: node.id, stepId: step.id })}
            onSubmit={(given, correct) =>
              onStepSubmit(node.id, given, correct, step.answer, step.id)
            }
            onSuccess={() => go(node.next!)}
            onErrorBranch={() => go(branchAfterError(strategy, step.id))}
          />
        );
      }

      case 'justify':
        if (!step) return null;
        return (
          <JustifyCard
            step={step}
            onAttempt={(given, correct, expected) =>
              onStepSubmit(node.id, given, correct, expected)
            }
            onComplete={() => go(node.next!)}
          />
        );

      case 'concept':
        if (!node.skill) return null;
        return (
          <ConceptCard skill={SKILLS[node.skill]} onComplete={() => go(node.next!)} />
        );

      case 'drill':
        if (!node.skill) return null;
        return (
          <DrillCard
            drills={SKILLS[node.skill].drills}
            onAttempt={(given, correct, expected) =>
              onStepSubmit(node.id, given, correct, expected)
            }
            onFail={() => dispatch({ type: 'fail', nodeId: node.id })}
            onComplete={() => go(node.next!)}
          />
        );

      case 'balance':
        if (!step?.balance) return null;
        return <BalanceCard spec={step.balance} onComplete={() => go(node.next!)} />;

      case 'diagnosis':
        if (!node.skill) return null;
        return (
          <DiagnosisCard skill={SKILLS[node.skill]} onComplete={() => go(node.next!)} />
        );

      case 'alt':
        return (
          <GraphCard
            spec={scenario.graph}
            failCount={run.failCount[node.id] ?? 0}
            onCheck={(x, y) => {
              dispatch({ type: 'alt', nodeId: node.id, x, y, found: true });
              return true;
            }}
            onFail={() => dispatch({ type: 'fail', nodeId: node.id })}
            onComplete={() => go(node.next!)}
            onShowDemo={() => go(`demo:${scenario.id}`)}
          />
        );

      case 'demo':
        return <DemoCard lines={scenario.solution} onComplete={() => go(node.next!)} />;

      case 'boostrap': {
        const skill = SKILLS[node.skill ?? scenario.coreSkill];
        return (
          <DrillCard
            drills={[skill.drills[0]]}
            title={`Экспресс-повтор: ${skill.title}`}
            subtitle="Одна задача, чтобы закрепить навык перед финишем"
            accent="violet"
            onAttempt={(given, correct, expected) =>
              onStepSubmit(node.id, given, correct, expected)
            }
            onFail={() => dispatch({ type: 'fail', nodeId: node.id })}
            onComplete={() => go(node.next!)}
          />
        );
      }

      case 'reflect':
        return (
          <ReflectCard
            scenario={scenario}
            choice={run.reflect.choice}
            text={run.reflect.text}
            onChange={(choice, text) => dispatch({ type: 'reflect', choice, text })}
            onComplete={() => go(node.next!)}
          />
        );

      case 'finish':
        return (
          <ReportCard
            run={run}
            scenario={scenario}
            otherSummary={otherSummary}
            onRestart={() => startRun(strategy, scenarioId)}
            onSwitchStrategy={() => startRun(otherStrategy, scenarioId)}
            onNewScenario={() => setView('setup')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#060915]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setView('setup')}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/50">
              <Icon name="route" className="h-5 w-5 text-white" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-white">MathPath</span>
          </button>

          {view === 'train' && (
            <>
              <span className="hidden h-6 w-px bg-white/10 sm:block" />
              <span className="hidden max-w-[240px] truncate rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 ring-1 ring-white/10 sm:inline">
                {scenario.title}
              </span>
              {node && (
                <span className="hidden items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 ring-1 ring-white/10 md:inline-flex">
                  <Icon name={NODE_META[node.kind].icon as IconName} className="h-3.5 w-3.5" />
                  {node.title}
                </span>
              )}
              <span
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ring-1 ${
                  strategy === 'A'
                    ? 'bg-violet-500/15 text-violet-200 ring-violet-400/30'
                    : 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30'
                }`}
              >
                Стратегия {strategy}: {STRATEGIES[strategy].name}
              </span>

              <div className="ml-auto flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 ring-1 ring-white/10 sm:flex">
                  <Icon name="clock" className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-mono text-xs font-bold text-slate-200">
                    {Math.floor(elapsed / 60000)}:
                    {String(Math.floor((elapsed / 1000) % 60)).padStart(2, '0')}
                  </span>
                </div>
                <div className="hidden items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 ring-1 ring-white/10 sm:flex">
                  <Icon name="target" className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-200">
                    {stepsDone} / {scenario.steps.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setView('setup')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  <Icon name="layers" className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Сценарии</span>
                </button>
                <button
                  type="button"
                  onClick={() => startRun(strategy, scenarioId)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  <Icon name="rotate" className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Заново</span>
                </button>
              </div>
            </>
          )}

          {view === 'setup' && (
            <div className="ml-auto flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Icon name="layers" className="h-4 w-4" />
              Один сценарий — две стратегии обучения
            </div>
          )}
        </div>
      </header>

      {view === 'setup' ? (
        <SetupView
          scenarioId={scenarioId}
          strategy={strategy}
          history={history}
          onScenario={setScenarioId}
          onStrategy={setStrategy}
          onStart={() => startRun()}
        />
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
            <section className="glass rounded-3xl p-5 sm:p-7">
              {renderNode()}
            </section>
            <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              <RouteMap route={route} visited={run.visited} steps={run.steps} />
              <MetricsPanel
                run={run}
                scenario={scenario}
                strategy={strategy}
                elapsed={elapsed}
              />
            </aside>
          </div>
        </main>
      )}
    </div>
  );
}

function IntroPanel({
  scenario,
  strategy,
  onStart,
}: {
  scenario: Scenario;
  strategy: StrategyId;
  onStart: () => void;
}) {
  return (
    <div className="anim-fade-up space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300/80">
          Сценарий: {scenario.topic} · {scenario.difficulty}
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">{scenario.title}</h1>
      </div>

      <div className="glass rounded-2xl px-5 py-6 text-center sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Уравнение
        </p>
        <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {scenario.equation}
        </p>
      </div>

      <p className="text-sm leading-relaxed text-slate-200">{scenario.intro}</p>

      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Icon name="route" className="h-4 w-4 text-indigo-300" />
          Твой маршрут: стратегия «{STRATEGIES[strategy].name}»
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {['Старт', ...scenario.steps.map((s) => s.title), 'Итоги'].map((label, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 ring-1 ring-white/10">
                {label}
              </span>
              {i < scenario.steps.length + 1 && (
                <Icon name="arrowRight" className="h-3.5 w-3.5 text-slate-600" />
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          {STRATEGIES[strategy].onError}
        </p>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 transition hover:brightness-110 active:scale-[0.98]"
      >
        <Icon name="play" className="h-4 w-4" />
        Начать решать
      </button>
    </div>
  );
}
