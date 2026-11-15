import React from 'react';
import {
  GitBranch,
  CheckCircle2,
  CircleDot,
  Sparkles,
  Compass,
  CornerDownRight,
  RotateCcw,
  SearchCheck,
  ShieldAlert,
  ArrowDown,
  Lock,
} from 'lucide-react';
import { EquationScenario, StrategyType } from '../data/scenarios';

export type ActiveStage =
  | { type: 'canonical'; stepNumber: 1 | 2 | 3 }
  | { type: 'remediationA'; stepNumber: 1 | 2 | 3; optionId: string; microSolved: boolean }
  | {
      type: 'consequenceB';
      originStepNumber: 1 | 2 | 3;
      optionId: string;
      phase: 'step2Star' | 'step3Star' | 'step4StarCheck' | 'step5StarDetective';
    }
  | { type: 'completed' };

export interface RouteHistoryEntry {
  id: string;
  label: string;
  expression: string;
  kind: 'canonical' | 'error-trigger' | 'remediation-a' | 'consequence-b' | 'verification-b' | 'completed';
  timestamp: string;
}

interface RouteGraphPanelProps {
  scenario: EquationScenario;
  strategy: StrategyType;
  activeStage: ActiveStage;
  completedCanonicalSteps: number[];
  completedRemediationsA: { stepNumber: number; substepId: string; title: string; fixedExpression: string }[];
  visitedConsequenceBranchB: {
    originStepNumber: number;
    flawedEquation: string;
    derivedRootExpr: string;
    contradictionText: string;
    resolved: boolean;
  } | null;
  onSimulateErrorClick: () => void;
  onSwitchStrategyWithSameError: () => void;
  canSimulateErrorNow: boolean;
}

export const RouteGraphPanel: React.FC<RouteGraphPanelProps> = ({
  scenario,
  strategy,
  activeStage,
  completedCanonicalSteps,
  completedRemediationsA,
  visitedConsequenceBranchB,
  onSimulateErrorClick,
  onSwitchStrategyWithSameError,
  canSimulateErrorNow,
}) => {
  const isStrategyA = strategy === 'strategyA';

  // Determine route metrics
  const totalNodesVisited =
    completedCanonicalSteps.length +
    completedRemediationsA.length +
    (visitedConsequenceBranchB ? (visitedConsequenceBranchB.originStepNumber === 1 ? 4 : 3) : 0);

  const hasTriggeredDeviation =
    completedRemediationsA.length > 0 ||
    activeStage.type === 'remediationA' ||
    activeStage.type === 'consequenceB' ||
    visitedConsequenceBranchB !== null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className={`px-5 py-4 border-b flex items-center justify-between gap-3 ${
          isStrategyA
            ? 'bg-gradient-to-r from-blue-50/90 via-blue-50/40 to-white border-blue-200/70'
            : 'bg-gradient-to-r from-orange-50/90 via-orange-50/40 to-white border-orange-200/70'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs ${
              isStrategyA
                ? 'bg-blue-600 text-white'
                : 'bg-orange-600 text-white'
            }`}
          >
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-base text-slate-900">
                Карта образовательного маршрута
              </h3>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isStrategyA
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-orange-100 text-orange-800 border border-orange-200'
                }`}
              >
                {isStrategyA ? 'Стратегия А' : 'Стратегия Б'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {isStrategyA
                ? 'При ошибке: мгновенная петля микро-коррекции правила и возврат к шагу'
                : 'При ошибке: продолжение решения вашего уравнения до проверки подстановкой'}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Demo Banner if user hasn't made an error yet */}
      <div className="px-5 pt-3.5 pb-1">
        {!hasTriggeredDeviation && canSimulateErrorNow ? (
          <div
            className={`rounded-xl p-3 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
              isStrategyA
                ? 'bg-blue-50/60 border-blue-200 text-blue-950'
                : 'bg-orange-50/60 border-orange-200 text-orange-950'
            }`}
          >
            <div className="text-xs leading-relaxed">
              <span className="font-bold">Хотите увидеть перестройку маршрута?</span>{' '}
              Совершите ошибку на текущем шаге или нажмите кнопку быстрой симуляции:
            </div>
            <button
              type="button"
              onClick={onSimulateErrorClick}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-2xs transition cursor-pointer ${
                isStrategyA
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Симулировать ошибку шага
            </button>
          </div>
        ) : hasTriggeredDeviation ? (
          <div className="rounded-xl p-3 border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="text-xs text-slate-700">
              <span className="font-bold text-slate-900">Маршрут адаптирован!</span>{' '}
              Сравните, как эта же ошибка меняет путь во второй стратегии:
            </div>
            <button
              type="button"
              onClick={onSwitchStrategyWithSameError}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                isStrategyA
                  ? 'bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100'
                  : 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              {isStrategyA
                ? 'Показать эту ошибку в Стратегии Б →'
                : '← Показать эту ошибку в Стратегии А'}
            </button>
          </div>
        ) : null}
      </div>

      {/* Main Node Graph Canvas */}
      <div className="p-5 flex-1 overflow-y-auto space-y-3 bg-math-subgrid">
        {/* Node 0: Initial Equation */}
        <div className="relative flex items-center gap-3 p-3 rounded-xl bg-slate-900 text-white shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center font-math text-xs font-bold shrink-0">
            0
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
              Старт • Условие задачи
            </div>
            <div className="font-math text-sm font-bold truncate">
              {scenario.originalEquation}
            </div>
          </div>
          <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-md font-medium">
            Дано
          </span>
        </div>

        {/* Render Steps 1, 2, 3 and their dynamic branches */}
        {scenario.steps.map((step) => {
          const isCompleted = completedCanonicalSteps.includes(step.stepNumber);
          const isCurrentCanonical =
            activeStage.type === 'canonical' && activeStage.stepNumber === step.stepNumber;
          const isCurrentRemediationHere =
            activeStage.type === 'remediationA' && activeStage.stepNumber === step.stepNumber;
          const completedRemediationForStep = completedRemediationsA.find(
            (r) => r.stepNumber === step.stepNumber
          );

          // Check if Strategy B branched off at this step
          const isBranchOriginB =
            (activeStage.type === 'consequenceB' &&
              activeStage.originStepNumber === step.stepNumber) ||
            (visitedConsequenceBranchB &&
              visitedConsequenceBranchB.originStepNumber === step.stepNumber);

          // Check if this canonical step was bypassed because Strategy B branched earlier
          const isBypassedInB =
            (activeStage.type === 'consequenceB' &&
              activeStage.originStepNumber < step.stepNumber) ||
            (visitedConsequenceBranchB &&
              !visitedConsequenceBranchB.resolved &&
              visitedConsequenceBranchB.originStepNumber < step.stepNumber);

          return (
            <React.Fragment key={step.stepNumber}>
              {/* Vertical Connector Arrow */}
              <div className="flex justify-center -my-1.5">
                <ArrowDown className="w-4 h-4 text-slate-400" />
              </div>

              {/* Canonical Step Node */}
              <div
                className={`relative rounded-xl border p-3.5 transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : isCurrentCanonical
                    ? isStrategyA
                      ? 'bg-white border-2 border-blue-600 shadow-sm animate-pulse-blue'
                      : 'bg-white border-2 border-orange-500 shadow-sm animate-pulse-orange'
                    : isCurrentRemediationHere
                    ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                    : isBranchOriginB
                    ? 'bg-orange-50/70 border-orange-300 text-orange-950'
                    : isBypassedInB
                    ? 'bg-slate-100/60 border-dashed border-slate-300 text-slate-400 opacity-65'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-math text-xs font-bold shrink-0 mt-0.5 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isCurrentCanonical
                          ? isStrategyA
                            ? 'bg-blue-600 text-white'
                            : 'bg-orange-600 text-white'
                          : isCurrentRemediationHere
                          ? 'bg-amber-500 text-white'
                          : isBranchOriginB
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {step.stepNumber}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-display font-bold text-xs sm:text-sm text-slate-900">
                          {step.title}
                        </span>
                        {isCompleted && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        {isCurrentCanonical && (
                          <CircleDot
                            className={`w-4 h-4 shrink-0 ${
                              isStrategyA ? 'text-blue-600' : 'text-orange-600'
                            }`}
                          />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {step.subtitle}
                      </p>
                      <div className="mt-1.5 font-math text-xs font-semibold px-2 py-1 rounded bg-white/90 border border-slate-200/80 inline-block text-slate-800">
                        {isCompleted ||
                        completedCanonicalSteps.includes(step.stepNumber) ||
                        activeStage.type === 'completed'
                          ? `✓ ${step.targetEquation}`
                          : `Цель: ${step.targetEquation}`}
                      </div>
                    </div>
                  </div>

                  {/* Step Status Pill */}
                  <div className="shrink-0">
                    {isCompleted ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        Верно
                      </span>
                    ) : isCurrentRemediationHere ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                        Перехват ошибки
                      </span>
                    ) : isBranchOriginB ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-orange-100 text-orange-800">
                        Точка ветвления
                      </span>
                    ) : isCurrentCanonical ? (
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          isStrategyA
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        Текущий шаг
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 inline-flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Ожидание
                      </span>
                    )}
                  </div>
                </div>

                {/* STRATEGY A DETOUR LOOP: If active or completed at this step */}
                {(isCurrentRemediationHere || completedRemediationForStep) && (
                  <div className="mt-3 ml-3 pl-3.5 border-l-2 border-blue-500 space-y-2 animate-slide-in">
                    <div
                      className={`rounded-xl p-3 border ${
                        isCurrentRemediationHere
                          ? 'bg-blue-50/90 border-blue-400 shadow-xs'
                          : 'bg-blue-50/40 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900">
                          <CornerDownRight className="w-3.5 h-3.5 text-blue-600" />
                          {completedRemediationForStep
                            ? `Подшаг ${completedRemediationForStep.substepId}: Правило отработано`
                            : `Подшаг ${step.stepNumber}.1: Микро-тренажёр правила`}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            completedRemediationForStep
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {completedRemediationForStep ? 'Пройдено ✓' : 'Активная петля'}
                        </span>
                      </div>
                      <p className="text-xs text-blue-800 mt-1">
                        {completedRemediationForStep
                          ? `Ловушка устранена → возврат в основной маршрут (${completedRemediationForStep.fixedExpression})`
                          : 'Мгновенная диагностика правила + контрольный мини-вопрос перед продолжением маршрута.'}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-blue-700">
                        <RotateCcw className="w-3 h-3" />
                        <span>Возврат к Шагу {step.stepNumber} без накопления снежного кома ошибок</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STRATEGY B CONSEQUENCE BRANCH: If branched at this step */}
                {isBranchOriginB && (
                  <div className="mt-3 ml-2 pl-3.5 border-l-2 border-orange-500 space-y-2.5 animate-slide-in">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-orange-800 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-orange-600" />
                      Альтернативный маршрут следствия (Стратегия Б)
                    </div>

                    {/* If branched at Step 1, show Step 2* node */}
                    {step.stepNumber === 1 && (
                      <div
                        className={`rounded-lg p-2.5 border text-xs ${
                          activeStage.type === 'consequenceB' &&
                          activeStage.phase === 'step2Star'
                            ? 'bg-orange-50 border-orange-500 font-semibold text-orange-950 shadow-2xs'
                            : 'bg-white border-orange-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-orange-900">
                            Шаг 2*. Приведение подобных в вашей ветке
                          </span>
                          {activeStage.type === 'consequenceB' &&
                          activeStage.phase === 'step2Star' ? (
                            <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.5 rounded font-bold">
                              Сейчас здесь
                            </span>
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
                          )}
                        </div>
                        <div className="font-math text-[11px] text-slate-600 mt-0.5">
                          Упрощение вашего модифицированного уравнения
                        </div>
                      </div>
                    )}

                    {/* Step 3* node */}
                    <div
                      className={`rounded-lg p-2.5 border text-xs ${
                        activeStage.type === 'consequenceB' &&
                        activeStage.phase === 'step3Star'
                          ? 'bg-orange-50 border-orange-500 font-semibold text-orange-950 shadow-2xs'
                          : 'bg-white border-orange-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-orange-900">
                          Шаг 3*. Вычисление гипотетического корня
                        </span>
                        {activeStage.type === 'consequenceB' &&
                        activeStage.phase === 'step3Star' ? (
                          <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.5 rounded font-bold">
                            Сейчас здесь
                          </span>
                        ) : visitedConsequenceBranchB ? (
                          <span className="font-math text-[11px] font-bold text-orange-800">
                            {visitedConsequenceBranchB.derivedRootExpr}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Ученик доводит свою гипотезу до численного ответа
                      </div>
                    </div>

                    {/* Step 4* Verification in Original Equation */}
                    <div
                      className={`rounded-lg p-2.5 border text-xs ${
                        activeStage.type === 'consequenceB' &&
                        activeStage.phase === 'step4StarCheck'
                          ? 'bg-rose-50 border-rose-400 font-semibold text-rose-950 shadow-2xs'
                          : 'bg-white border-orange-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-rose-900 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          Шаг 4*. Проверка подстановкой в исходное
                        </span>
                        {activeStage.type === 'consequenceB' &&
                        activeStage.phase === 'step4StarCheck' ? (
                          <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold">
                            Проверка весов
                          </span>
                        ) : null}
                      </div>
                      <div className="font-math text-[11px] text-rose-700 mt-0.5">
                        {visitedConsequenceBranchB
                          ? `Противоречие на весах: ${visitedConsequenceBranchB.contradictionText}`
                          : 'Обнаружение дисбаланса левой и правой частей'}
                      </div>
                    </div>

                    {/* Step 5* Detective & Return */}
                    <div
                      className={`rounded-lg p-2.5 border text-xs ${
                        activeStage.type === 'consequenceB' &&
                        activeStage.phase === 'step5StarDetective'
                          ? 'bg-amber-50 border-amber-500 font-semibold text-amber-950 shadow-2xs'
                          : visitedConsequenceBranchB?.resolved
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-white border-orange-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold flex items-center gap-1">
                          <SearchCheck className="w-3.5 h-3.5 text-amber-600" />
                          Шаг 5*. Детектив ошибки и коррекция корня
                        </span>
                        {visitedConsequenceBranchB?.resolved && (
                          <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                            Исправлено ✓
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Самостоятельный поиск строки, где нарушилась равносильность
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}

        {/* Final Target Node */}
        <div className="flex justify-center -my-1.5">
          <ArrowDown className="w-4 h-4 text-slate-400" />
        </div>

        <div
          className={`rounded-xl p-3.5 border flex items-center justify-between gap-3 transition-all ${
            activeStage.type === 'completed'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
              : 'bg-slate-100 border-slate-200/90 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-math text-xs font-bold ${
                activeStage.type === 'completed'
                  ? 'bg-white text-emerald-700'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              ✓
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">
                Финиш маршрута • Истинный корень
              </div>
              <div className="font-math text-sm font-bold">
                {scenario.trueRootExpression} (Проверка: {scenario.verifiedValueBothSides} ={' '}
                {scenario.verifiedValueBothSides})
              </div>
            </div>
          </div>
          {activeStage.type === 'completed' && (
            <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-lg">
              Уравнение решено!
            </span>
          )}
        </div>
      </div>

      {/* Bottom 3-Data-Point Pedagogical Summary Footer */}
      <div className="p-4 bg-[#FAF8F5] border-t border-slate-200/90 grid grid-cols-3 gap-2.5">
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Реакция на ошибку
          </div>
          <div
            className={`text-xs font-bold mt-0.5 ${
              isStrategyA ? 'text-blue-700' : 'text-orange-700'
            }`}
          >
            {isStrategyA ? 'Мгновенный стоп + Подшаг' : 'Следствие → Подстановка'}
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Пройдено узлов
          </div>
          <div className="font-math text-xs font-bold text-slate-900 mt-0.5">
            {totalNodesVisited} {totalNodesVisited === 1 ? 'узел' : totalNodesVisited >= 2 && totalNodesVisited <= 4 ? 'узла' : 'узлов'}{' '}
            <span className="text-slate-400 font-normal">
              ({hasTriggeredDeviation ? 'адаптивный' : 'прямой'})
            </span>
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Педагогический эффект
          </div>
          <div className="text-xs font-bold text-slate-800 mt-0.5 truncate" title={isStrategyA ? 'Снижение когнитивной перегрузки' : 'Осознание смысла корня уравнения'}>
            {isStrategyA ? 'Закрепление правила' : 'Самопроверка гипотезы'}
          </div>
        </div>
      </div>
    </div>
  );
};
