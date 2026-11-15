import { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Compass,
  RotateCcw,
  GitCompare,
  Sparkles,
  BookOpenCheck,
  Zap,
} from 'lucide-react';
import {
  SCENARIOS,
  EquationScenario,
  StrategyType,
  StepOption,
} from './data/scenarios';
import { RouteGraphPanel, ActiveStage } from './components/RouteGraphPanel';
import { EquationWorkbench } from './components/EquationWorkbench';
import { BalanceScaleCard } from './components/BalanceScaleCard';
import { StrategyComparisonModal } from './components/StrategyComparisonModal';
import { DualTrajectoryVisualizer } from './components/DualTrajectoryVisualizer';

export function App() {
  const [scenarioIndex, setScenarioIndex] = useState<number>(0);
  const scenario: EquationScenario = SCENARIOS[scenarioIndex];

  const [strategy, setStrategy] = useState<StrategyType>('strategyA');
  const [activeStage, setActiveStage] = useState<ActiveStage>({
    type: 'canonical',
    stepNumber: 1,
  });

  const [completedCanonicalSteps, setCompletedCanonicalSteps] = useState<number[]>([]);
  const [completedRemediationsA, setCompletedRemediationsA] = useState<
    {
      stepNumber: number;
      substepId: string;
      title: string;
      fixedExpression: string;
    }[]
  >([]);

  const [visitedConsequenceBranchB, setVisitedConsequenceBranchB] = useState<{
    originStepNumber: number;
    flawedEquation: string;
    derivedRootExpr: string;
    contradictionText: string;
    resolved: boolean;
  } | null>(null);

  // Track last error made so user can switch strategy and immediately see how the OTHER strategy handles the exact same error
  const [lastTriggeredError, setLastTriggeredError] = useState<{
    stepNumber: 1 | 2 | 3;
    optionId: string;
  } | null>(null);

  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);

  const triggerCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.65 },
      });
    } catch {
      // ignore if canvas-confetti fails in headless environment
    }
  }, []);

  // Reset current scenario state
  const handleReset = useCallback((newStrategy?: StrategyType, newScenarioIdx?: number) => {
    if (newStrategy) setStrategy(newStrategy);
    if (newScenarioIdx !== undefined) setScenarioIndex(newScenarioIdx);
    setActiveStage({ type: 'canonical', stepNumber: 1 });
    setCompletedCanonicalSteps([]);
    setCompletedRemediationsA([]);
    setVisitedConsequenceBranchB(null);
    setLastTriggeredError(null);
  }, []);

  // Trigger an error on a given step in a given strategy (used by user choice OR 1-click simulation)
  const triggerStepError = useCallback(
    (
      targetStrategy: StrategyType,
       targetScenario: EquationScenario,
      stepNumber: 1 | 2 | 3,
      wrongOption: StepOption
    ) => {
      setStrategy(targetStrategy);
      setLastTriggeredError({ stepNumber, optionId: wrongOption.id });

      // Ensure prior canonical steps are marked completed
      const priorSteps = [1, 2, 3].filter((n) => n < stepNumber);
      setCompletedCanonicalSteps(priorSteps);

      if (targetStrategy === 'strategyA') {
        setVisitedConsequenceBranchB(null);
        setActiveStage({
          type: 'remediationA',
          stepNumber,
          optionId: wrongOption.id,
          microSolved: false,
        });
      } else {
        setCompletedRemediationsA([]);
        const stepObj = targetScenario.steps[stepNumber - 1];
        const consB =
          stepObj.consequencesB[wrongOption.id] ||
          Object.values(stepObj.consequencesB)[0];

        setVisitedConsequenceBranchB({
          originStepNumber: stepNumber,
          flawedEquation: consB.flawedEquationAtOrigin,
          derivedRootExpr: consB.step3Star.derivedRootExpression,
          contradictionText: `${consB.step4StarCheck.substitutedValueLeft} ≠ ${consB.step4StarCheck.expectedValueRight}`,
          resolved: false,
        });

        setActiveStage({
          type: 'consequenceB',
          originStepNumber: stepNumber,
          optionId: wrongOption.id,
          phase: consB.step2Star ? 'step2Star' : 'step3Star',
        });
      }
    },
    []
  );

  // Handle selecting an option on a canonical step
  const handleSelectStepOption = (stepNumber: 1 | 2 | 3, option: StepOption) => {
    if (option.isCorrect) {
      setCompletedCanonicalSteps((prev) =>
        prev.includes(stepNumber) ? prev : [...prev, stepNumber]
      );
      if (stepNumber < 3) {
        setActiveStage({
          type: 'canonical',
          stepNumber: (stepNumber + 1) as 1 | 2 | 3,
        });
      } else {
        setActiveStage({ type: 'completed' });
        triggerCelebration();
      }
    } else {
      triggerStepError(strategy, scenario, stepNumber, option);
    }
  };

  // Handle manual formula input
  const handleSubmitManualExpression = (stepNumber: 1 | 2 | 3, rawInput: string) => {
    const normalized = rawInput.replace(/\s+/g, '').toLowerCase();
    const stepObj = scenario.steps[stepNumber - 1];

    // Check if matches canonical target
    const isCanonicalMatch =
      stepObj.acceptableNormalizedInputs.some(
        (acc) => acc.replace(/\s+/g, '').toLowerCase() === normalized
      ) ||
      stepObj.targetEquation.replace(/\s+/g, '').toLowerCase() === normalized;

    if (isCanonicalMatch) {
      const correctOpt = stepObj.options.find((o) => o.isCorrect)!;
      handleSelectStepOption(stepNumber, correctOpt);
      return;
    }

    // Check if matches one of the known wrong options
    const matchedWrong = stepObj.options.find(
      (o) =>
        !o.isCorrect &&
        o.expression.replace(/\s+/g, '').toLowerCase() === normalized
    );

    const fallbackWrong =
      matchedWrong || stepObj.options.find((o) => !o.isCorrect) || stepObj.options[1];

    triggerStepError(strategy, scenario, stepNumber, fallbackWrong);
  };

  // Complete Strategy A micro-remediation detour and return to main path
  const handleCompleteRemediationA = (
    stepNumber: 1 | 2 | 3,
    substepId: string,
    title: string,
    fixedExpression: string
  ) => {
    setCompletedRemediationsA((prev) => [
      ...prev.filter((r) => r.stepNumber !== stepNumber),
      { stepNumber, substepId, title, fixedExpression },
    ]);
    setCompletedCanonicalSteps((prev) =>
      prev.includes(stepNumber) ? prev : [...prev, stepNumber]
    );

    if (stepNumber < 3) {
      setActiveStage({
        type: 'canonical',
        stepNumber: (stepNumber + 1) as 1 | 2 | 3,
      });
    } else {
      setActiveStage({ type: 'completed' });
      triggerCelebration();
    }
  };

  // Advance Strategy B consequence branch phases
  const handleAdvanceConsequenceB = (
    nextPhase: 'step3Star' | 'step4StarCheck' | 'step5StarDetective' | 'resolved'
  ) => {
    if (activeStage.type !== 'consequenceB') return;

    if (nextPhase === 'resolved') {
      setVisitedConsequenceBranchB((prev) =>
        prev ? { ...prev, resolved: true } : null
      );
      setCompletedCanonicalSteps([1, 2, 3]);
      setActiveStage({ type: 'completed' });
      triggerCelebration();
    } else {
      setActiveStage({
        ...activeStage,
        phase: nextPhase,
      });
    }
  };

  // Simulate error on current step or specific step
  const handleSimulateError = (
    targetStrat: StrategyType = strategy,
    forcedStepNumber?: 1 | 2 | 3
  ) => {
    const stepNum =
      forcedStepNumber ??
      (activeStage.type === 'canonical' ? activeStage.stepNumber : 1);
    const stepObj = scenario.steps[stepNum - 1];
    const wrongOpt =
      stepObj.options.find((o) => !o.isCorrect) || stepObj.options[1];
    triggerStepError(targetStrat, scenario, stepNum, wrongOpt);
  };

  // Switch to the other strategy and replay the exact same intermediate error for instant comparison
  const handleSwitchStrategyWithSameError = () => {
    const otherStrategy: StrategyType =
      strategy === 'strategyA' ? 'strategyB' : 'strategyA';
    const stepNum = lastTriggeredError?.stepNumber ?? 1;
    const stepObj = scenario.steps[stepNum - 1];
    const wrongOpt =
      stepObj.options.find((o) => o.id === lastTriggeredError?.optionId) ||
      stepObj.options.find((o) => !o.isCorrect) ||
      stepObj.options[1];

    triggerStepError(otherStrategy, scenario, stepNum, wrongOpt);
  };

  // Compute Balance Scale props based on current active stage
  const getBalanceScaleProps = () => {
    if (activeStage.type === 'completed') {
      return {
        leftExpression: `${scenario.initialLeftLabel} = ${scenario.verifiedValueBothSides}`,
        rightExpression: `${scenario.initialRightLabel} = ${scenario.verifiedValueBothSides}`,
        mode: 'solved' as const,
        statusCaption: `Подстановка корня ${scenario.trueRootExpression} в исходное уравнение подтверждает полное равенство`,
      };
    }

    if (activeStage.type === 'remediationA') {
      const st = scenario.steps[activeStage.stepNumber - 1];
      const rem =
        st.remediationsA[activeStage.optionId] ||
        Object.values(st.remediationsA)[0];
      const parts = rem.brokenExpression.split('=');
      return {
        leftExpression: parts[0]?.trim() || rem.brokenExpression,
        rightExpression: parts[1]?.trim() || scenario.initialRightLabel,
        mode: 'remediationA' as const,
        statusCaption:
          'Стратегия А остановила шаг: обнаружена попытка неравносильного преобразования',
      };
    }

    if (activeStage.type === 'consequenceB') {
      const st = scenario.steps[activeStage.originStepNumber - 1];
      const cons =
        st.consequencesB[activeStage.optionId] ||
        Object.values(st.consequencesB)[0];

      if (
        activeStage.phase === 'step4StarCheck' ||
        activeStage.phase === 'step5StarDetective'
      ) {
        return {
          leftExpression: `При ${cons.step3Star.derivedRootExpression}: ЛЧ = ${cons.step4StarCheck.substitutedValueLeft}`,
          rightExpression: `ПЧ = ${cons.step4StarCheck.expectedValueRight}`,
          mode: 'contradictionB' as const,
          leftNumericValue: cons.step4StarCheck.substitutedValueLeft,
          rightNumericValue: cons.step4StarCheck.expectedValueRight,
          statusCaption:
            'Подстановка полученного корня в исходное уравнение выявила дисбаланс чаш весов!',
        };
      }

      const eq =
        activeStage.phase === 'step2Star'
          ? cons.flawedEquationAtOrigin
          : cons.step3Star.currentEquation;
      const parts = eq.split('=');
      return {
        leftExpression: parts[0]?.trim() || eq,
        rightExpression: parts[1]?.trim() || scenario.initialRightLabel,
        mode: 'hypothesisB' as const,
        statusCaption:
          'Стратегия Б: решаем ваше модифицированное уравнение до финальной проверки подстановкой',
      };
    }

    // Default: canonical step
    const currentStepObj = scenario.steps[activeStage.stepNumber - 1];
    const parts = currentStepObj.inputEquation.split('=');
    return {
      leftExpression: parts[0]?.trim() || scenario.initialLeftLabel,
      rightExpression: parts[1]?.trim() || scenario.initialRightLabel,
      mode: 'balanced' as const,
      statusCaption: `Текущее равносильное уравнение перед выполнением Шага ${activeStage.stepNumber}`,
    };
  };

  const scaleProps = getBalanceScaleProps();

  return (
    <div className="min-h-screen bg-math-grid text-[#181E29] flex flex-col">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-math font-bold text-base shadow-xs">
              ∑x
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-lg tracking-tight text-slate-900">
                  MathPath
                </span>
                <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  Интерактивный практикум 7–9 класс
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Пошаговое решение уравнений с двумя адаптивными стратегиями при ошибке
              </p>
            </div>
          </div>

          {/* Segmented Dual-Strategy Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/90">
            <button
              type="button"
              onClick={() => {
                if (strategy !== 'strategyA') {
                  if (lastTriggeredError && activeStage.type !== 'completed') {
                    const stObj = scenario.steps[lastTriggeredError.stepNumber - 1];
                    const wOpt =
                      stObj.options.find((o) => o.id === lastTriggeredError.optionId) ||
                      stObj.options.find((o) => !o.isCorrect)!;
                    triggerStepError('strategyA', scenario, lastTriggeredError.stepNumber, wOpt);
                  } else {
                    setStrategy('strategyA');
                  }
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                strategy === 'strategyA'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <div>Стратегия А: «Направляющий тьютор»</div>
                <div
                  className={`text-[10px] font-normal hidden md:block ${
                    strategy === 'strategyA' ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  Мгновенная петля микро-разбора
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (strategy !== 'strategyB') {
                  if (lastTriggeredError && activeStage.type !== 'completed') {
                    const stObj = scenario.steps[lastTriggeredError.stepNumber - 1];
                    const wOpt =
                      stObj.options.find((o) => o.id === lastTriggeredError.optionId) ||
                      stObj.options.find((o) => !o.isCorrect)!;
                    triggerStepError('strategyB', scenario, lastTriggeredError.stepNumber, wOpt);
                  } else {
                    setStrategy('strategyB');
                  }
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                strategy === 'strategyB'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <div>Стратегия Б: «Исследовательское открытие»</div>
                <div
                  className={`text-[10px] font-normal hidden md:block ${
                    strategy === 'strategyB' ? 'text-orange-100' : 'text-slate-400'
                  }`}
                >
                  Вывод следствия и проверка подстановкой
                </div>
              </div>
            </button>
          </div>

          {/* Utility Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsComparisonModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition cursor-pointer"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Сравнить 2 стратегии</span>
            </button>

            <button
              type="button"
              onClick={() => handleReset()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
              title="Начать сценарий сначала"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Сброс</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Scenario Selector & Quick Simulation Control Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-1">
              <BookOpenCheck className="w-4 h-4 text-slate-500" />
              Учебный сценарий:
            </span>
            {SCENARIOS.map((sc, idx) => {
              const isSelected = idx === scenarioIndex;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleReset(strategy, idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{sc.badge}:</span>
                  <span className="font-math font-bold">{sc.originalEquation}</span>
                </button>
              );
            })}
          </div>

          {/* Instant Interactive Error Simulation Triggers */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Быстрый тест ошибки на Шаге 1:
            </span>
            <button
              type="button"
              onClick={() => handleSimulateError('strategyA', 1)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition cursor-pointer"
            >
              Ошибка → Стратегия А (Подшаг 1.1)
            </button>
            <button
              type="button"
              onClick={() => handleSimulateError('strategyB', 1)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 transition cursor-pointer"
            >
              Ошибка → Стратегия Б (Ветка следствия)
            </button>
          </div>
        </div>

        {/* Active Strategy Context Banner */}
        <div
          className={`rounded-2xl px-5 py-3.5 border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors ${
            strategy === 'strategyA'
              ? 'bg-blue-50/75 border-blue-200 text-blue-950'
              : 'bg-orange-50/75 border-orange-200 text-orange-950'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                strategy === 'strategyA'
                  ? 'bg-blue-600 text-white'
                  : 'bg-orange-600 text-white'
              }`}
            >
              {strategy === 'strategyA' ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <Compass className="w-4 h-4" />
              )}
            </div>
            <div className="text-xs sm:text-sm">
              {strategy === 'strategyA' ? (
                <>
                  <strong>Активна Стратегия А («Направляющий тьютор»):</strong> если ученик
                  ошибается на промежуточном шаге, система сразу перехватывает ошибку, создаёт{' '}
                  <span className="underline decoration-blue-400 font-semibold">
                    боковой Подшаг микро-обучения
                  </span>{' '}
                  и после отработки правила возвращает на эталонный маршрут.
                </>
              ) : (
                <>
                  <strong>Активна Стратегия Б («Исследовательское открытие»):</strong> если ученик
                  ошибается на промежуточном шаге, система{' '}
                  <span className="underline decoration-orange-400 font-semibold">
                    перестраивает дальнейшие шаги под его уравнение
                  </span>
                  , даёт вычислить корень-следствие и приводит к открытию противоречия при подстановке в исходное условие.
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsComparisonModalOpen(true)}
            className="shrink-0 text-xs font-bold underline hover:opacity-80 cursor-pointer"
          >
            Подробнее о механике →
          </button>
        </div>

        {/* 12-Column Primary Split Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Columns: Step-by-Step Equation Solving Workbench + Balance Scale */}
          <div className="lg:col-span-7 space-y-5">
            <EquationWorkbench
              scenario={scenario}
              strategy={strategy}
              activeStage={activeStage}
              completedCanonicalSteps={completedCanonicalSteps}
              completedRemediationsA={completedRemediationsA}
              visitedConsequenceBranchB={visitedConsequenceBranchB}
              onSelectStepOption={handleSelectStepOption}
              onSubmitManualExpression={handleSubmitManualExpression}
              onCompleteRemediationA={handleCompleteRemediationA}
              onAdvanceConsequenceB={handleAdvanceConsequenceB}
              onResetScenario={() => handleReset()}
              onCompareOtherStrategyWithError={handleSwitchStrategyWithSameError}
            />

            <BalanceScaleCard
              strategy={strategy}
              leftExpression={scaleProps.leftExpression}
              rightExpression={scaleProps.rightExpression}
              mode={scaleProps.mode}
              leftNumericValue={scaleProps.leftNumericValue}
              rightNumericValue={scaleProps.rightNumericValue}
              statusCaption={scaleProps.statusCaption}
            />
          </div>

          {/* Right 5 Columns: Live Route Graph & Trajectory Map */}
          <div className="lg:col-span-5 lg:sticky lg:top-20">
            <RouteGraphPanel
              scenario={scenario}
              strategy={strategy}
              activeStage={activeStage}
              completedCanonicalSteps={completedCanonicalSteps}
              completedRemediationsA={completedRemediationsA}
              visitedConsequenceBranchB={visitedConsequenceBranchB}
              onSimulateErrorClick={() => handleSimulateError(strategy)}
              onSwitchStrategyWithSameError={handleSwitchStrategyWithSameError}
              canSimulateErrorNow={activeStage.type === 'canonical'}
            />
          </div>
        </div>

        {/* Full-Width Dual Strategy Trajectory Blueprints on Current Scenario */}
        <DualTrajectoryVisualizer
          scenario={scenario}
          activeStrategy={strategy}
          onSimulateStrategyError={(strat, stepNum) =>
            handleSimulateError(strat, stepNum)
          }
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 mt-10 py-5">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>
              <strong>MathPath</strong> — Интерактивная образовательная среда пошагового решения уравнений с адаптивным ветвлением маршрута
            </span>
          </div>
          <div>
            Две педагогические стратегии: «Направляющий тьютор» (Guided Scaffolding) и «Исследовательское открытие» (Productive Failure)
          </div>
        </div>
      </footer>

      {/* Strategy Comparison Modal */}
      <StrategyComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        scenario={scenario}
        onLaunchDemoWithError={(selectedStrat) =>
          handleSimulateError(selectedStrat, 1)
        }
      />
    </div>
  );
}
export default App;
