import React, { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Compass,
  Keyboard,
  MousePointerClick,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  SearchCheck,
  ShieldCheck,
  Eye,
  Lightbulb,
  BookOpen,
} from 'lucide-react';
import {
  EquationScenario,
  StrategyType,
  StepOption,
} from '../data/scenarios';
import { ActiveStage } from './RouteGraphPanel';

interface EquationWorkbenchProps {
  scenario: EquationScenario;
  strategy: StrategyType;
  activeStage: ActiveStage;
  completedCanonicalSteps: number[];
  completedRemediationsA: {
    stepNumber: number;
    substepId: string;
    title: string;
    fixedExpression: string;
  }[];
  visitedConsequenceBranchB: {
    originStepNumber: number;
    flawedEquation: string;
    derivedRootExpr: string;
    contradictionText: string;
    resolved: boolean;
  } | null;
  onSelectStepOption: (stepNumber: 1 | 2 | 3, option: StepOption) => void;
  onSubmitManualExpression: (stepNumber: 1 | 2 | 3, rawInput: string) => void;
  onCompleteRemediationA: (
    stepNumber: 1 | 2 | 3,
    substepId: string,
    title: string,
    fixedExpression: string
  ) => void;
  onAdvanceConsequenceB: (
    nextPhase: 'step3Star' | 'step4StarCheck' | 'step5StarDetective' | 'resolved'
  ) => void;
  onResetScenario: () => void;
  onCompareOtherStrategyWithError: () => void;
}

export const EquationWorkbench: React.FC<EquationWorkbenchProps> = ({
  scenario,
  strategy,
  activeStage,
  completedCanonicalSteps,
  completedRemediationsA,
  visitedConsequenceBranchB,
  onSelectStepOption,
  onSubmitManualExpression,
  onCompleteRemediationA,
  onAdvanceConsequenceB,
  onResetScenario,
  onCompareOtherStrategyWithError,
}) => {
  const isStrategyA = strategy === 'strategyA';

  // Input mode: 'cards' (interactive step choices) or 'manual' (type formula)
  const [inputMode, setInputMode] = useState<'cards' | 'manual'>('cards');
  const [manualText, setManualText] = useState('');
  const [showRuleHint, setShowRuleHint] = useState(false);
  const [teacherHighlightTraps, setTeacherHighlightTraps] = useState(false);

  // Local state for Strategy A Micro-Question
  const [selectedMicroOptionId, setSelectedMicroOptionId] = useState<string | null>(null);

  // Local state for Strategy B phases
  const [branchFeedback, setBranchFeedback] = useState<string | null>(null);
  const [selectedDetectiveIndex, setSelectedDetectiveIndex] = useState<number | null>(null);

  const handleInsertMathToken = (token: string) => {
    setManualText((prev) => prev + token);
  };

  // Render Completed Notebook Ledger Steps
  const renderNotebookLedger = () => {
    return (
      <div className="space-y-2.5 mb-5">
        {/* Step 0: Original Equation */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <span className="text-xs font-math uppercase tracking-wider px-2 py-0.5 rounded bg-white/15 text-slate-200 font-semibold">
              Условие
            </span>
            <span className="font-math text-base sm:text-lg font-bold tracking-tight">
              {scenario.originalEquation}
            </span>
          </div>
          <span className="text-xs text-slate-300 hidden sm:inline">
            Найти корень x
          </span>
        </div>

        {/* Completed canonical steps */}
        {scenario.steps.map((st) => {
          if (!completedCanonicalSteps.includes(st.stepNumber)) return null;
          const hadRemediation = completedRemediationsA.find(
            (r) => r.stepNumber === st.stepNumber
          );
          return (
            <div
              key={st.stepNumber}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 animate-slide-in"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-800">
                  Шаг {st.stepNumber}:
                </span>
                <span className="font-math text-sm sm:text-base font-bold text-slate-900">
                  {st.targetEquation}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hadRemediation && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Исправлено через Подшаг {hadRemediation.substepId}
                  </span>
                )}
                <span className="text-xs text-emerald-700 font-medium">
                  Равносильно ✓
                </span>
              </div>
            </div>
          );
        })}

        {/* If Strategy B consequence branch was resolved, show badge */}
        {visitedConsequenceBranchB?.resolved && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-orange-50/90 border border-orange-300 text-orange-950 animate-slide-in">
            <div className="flex items-center gap-2 text-xs">
              <Compass className="w-4 h-4 text-orange-600 shrink-0" />
              <span>
                <strong>Исследовательский путь (Стратегия Б):</strong> гипотеза{' '}
                <span className="font-math font-bold">
                  {visitedConsequenceBranchB.flawedEquation}
                </span>{' '}
                привела к{' '}
                <span className="font-math font-bold">
                  {visitedConsequenceBranchB.derivedRootExpr}
                </span>{' '}
                → подстановка показала противоречие{' '}
                <span className="font-math font-bold text-rose-700">
                  ({visitedConsequenceBranchB.contradictionText})
                </span>{' '}
                → ошибка найдена и устранена!
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 1. RENDER CANONICAL STEP VIEW
  const renderCanonicalStep = (stepNumber: 1 | 2 | 3) => {
    const step = scenario.steps[stepNumber - 1];

    return (
      <div className="space-y-5 animate-slide-in">
        {/* Current Step Header Banner */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isStrategyA
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                Активный этап • {step.title}
              </span>
              <button
                type="button"
                onClick={() => setShowRuleHint((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded-md hover:bg-slate-100 transition cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                {showRuleHint ? 'Скрыть правило' : 'Напомнить правило'}
              </button>
            </div>
            <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 mt-1.5">
              {step.goalDescription}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {step.subtitle}
            </p>
          </div>

          {/* Toggle Teacher Trap Highlighter */}
          <button
            type="button"
            onClick={() => setTeacherHighlightTraps((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
              teacherHighlightTraps
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Показать, какие варианты содержат типичную ошибку для тестирования маршрутов"
          >
            <Eye className="w-3.5 h-3.5" />
            {teacherHighlightTraps ? 'Ловушки подсвечены' : 'Подсветить ловушки'}
          </button>
        </div>

        {/* Rule Hint Box */}
        {showRuleHint && (
          <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-amber-950 animate-slide-in">
            <BookOpen className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Опорное правило: </span>
              {step.ruleHint}
            </div>
          </div>
        )}

        {/* Current Equation Spotlight */}
        <div className="bg-[#FAF8F5] rounded-2xl border border-slate-200/90 p-5 text-center relative overflow-hidden">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Преобразуемое уравнение на Шаге {step.stepNumber}
          </div>
          <div className="font-math text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {step.inputEquation}
          </div>
        </div>

        {/* Mode Switcher: Interactive Cards vs Manual Formula Input */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Выберите способ выполнения шага:
          </div>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setInputMode('cards')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                inputMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              Варианты преобразования
            </button>
            <button
              type="button"
              onClick={() => setInputMode('manual')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                inputMode === 'manual'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              Свободный ввод формулы
            </button>
          </div>
        </div>

        {inputMode === 'cards' ? (
          <div className="space-y-3">
            {step.options.map((opt, idx) => {
              const isTrap = !opt.isCorrect;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSelectedMicroOptionId(null);
                    setBranchFeedback(null);
                    setSelectedDetectiveIndex(null);
                    onSelectStepOption(step.stepNumber, opt);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group cursor-pointer ${
                    teacherHighlightTraps && isTrap
                      ? 'bg-amber-50/40 border-amber-300 hover:border-amber-500 hover:bg-amber-50/80'
                      : 'bg-white border-slate-200/90 hover:border-slate-400 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl font-math text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 transition ${
                        isStrategyA
                          ? 'bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-orange-600 group-hover:text-white'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-math text-base sm:text-lg font-bold text-slate-900">
                          {opt.expression}
                        </span>
                        {teacherHighlightTraps && isTrap && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            Типичная ошибка (тест ветвления)
                          </span>
                        )}
                        {teacherHighlightTraps && !isTrap && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Верный шаг
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Действие: {opt.actionLabel}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-center">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
                        isStrategyA
                          ? 'bg-slate-50 border-slate-200 text-slate-700 group-hover:bg-blue-50 group-hover:border-blue-300 group-hover:text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 group-hover:bg-orange-50 group-hover:border-orange-300 group-hover:text-orange-700'
                      }`}
                    >
                      Применить шаг
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Manual Algebraic Input + Tactile Math Keypad */
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Введите полученное уравнение для Шага {step.stepNumber}:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={`Например: ${step.targetEquation}`}
                className="flex-1 font-math text-base px-4 py-2.5 rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualText.trim()) {
                    onSubmitManualExpression(step.stepNumber, manualText);
                    setManualText('');
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (!manualText.trim()) return;
                  onSubmitManualExpression(step.stepNumber, manualText);
                  setManualText('');
                }}
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white shadow-xs transition cursor-pointer ${
                  isStrategyA
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                Проверить запись
              </button>
            </div>

            {/* Quick Math Keypad */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 mr-1">Клавиатура:</span>
              {['x', '=', '+', '-', '(', ')', '2', '3', '4', '5', '6', '7', '10'].map(
                (tok) => (
                  <button
                    key={tok}
                    type="button"
                    onClick={() => handleInsertMathToken(tok)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-math text-xs font-semibold text-slate-800 shadow-2xs cursor-pointer"
                  >
                    {tok}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setManualText('')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium ml-auto cursor-pointer"
              >
                Очистить
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 2. RENDER STRATEGY A MICRO-REMEDIATION DETOUR VIEW
  const renderRemediationA = (stepNumber: 1 | 2 | 3, optionId: string) => {
    const step = scenario.steps[stepNumber - 1];
    const remediation =
      step.remediationsA[optionId] || Object.values(step.remediationsA)[0];
    const selectedOpt = remediation.microQuestion.options.find(
      (o) => o.id === selectedMicroOptionId
    );
    const isMicroCorrect = selectedOpt?.isCorrect === true;

    return (
      <div className="rounded-2xl border-2 border-blue-500 bg-blue-50/40 p-5 space-y-5 animate-slide-in">
        {/* Top Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-600 text-white">
                  Стратегия А • Мгновенное микро-ветвление
                </span>
                <span className="text-xs font-semibold text-blue-900">
                  Узел {remediation.substepId}
                </span>
              </div>
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 mt-0.5">
                {remediation.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onCompareOtherStrategyWithError}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-orange-100 text-orange-900 border border-orange-300 hover:bg-orange-200 transition cursor-pointer"
          >
            А как бы поступил маршрут Б? →
          </button>
        </div>

        {/* Visual Diagnostic Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="bg-white rounded-xl p-3.5 border border-rose-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-1">
              Ваш вариант (содержит ловушку)
            </div>
            <div className="font-math text-base font-bold text-rose-900">
              {remediation.brokenExpression}
            </div>
            <div className="mt-1.5 text-xs text-rose-700">
              Обратите внимание на участок:{' '}
              <span className="font-math font-bold bg-rose-100 px-1.5 py-0.5 rounded">
                {remediation.highlightBadToken}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-emerald-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
              {remediation.ruleName}
            </div>
            <div className="font-math text-base font-bold text-emerald-900">
              {remediation.correctExpression}
            </div>
            <div className="mt-1.5 text-xs text-emerald-800">
              Должно получиться:{' '}
              <span className="font-math font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                {remediation.highlightGoodToken}
              </span>
            </div>
          </div>
        </div>

        {/* Rule Explanation */}
        <div className="bg-white rounded-xl p-4 border border-blue-200/90 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <strong className="text-blue-950 block mb-1">
            Почему сработала остановка маршрута (Стратегия А):
          </strong>
          {remediation.visualExplanation}
        </div>

        {/* Interactive 1-Step Micro-Drill to unlock return to main path */}
        <div className="bg-white rounded-2xl p-4 border border-blue-300 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Контрольное микро-задание для возврата на маршрут
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {remediation.microQuestion.prompt}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {remediation.microQuestion.options.map((mOpt) => {
              const isSelected = selectedMicroOptionId === mOpt.id;
              return (
                <button
                  key={mOpt.id}
                  type="button"
                  onClick={() => setSelectedMicroOptionId(mOpt.id)}
                  className={`p-3 rounded-xl border font-math text-sm font-bold text-center transition cursor-pointer ${
                    isSelected
                      ? mOpt.isCorrect
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-rose-50 text-rose-900 border-rose-400'
                      : 'bg-slate-50 hover:bg-blue-50/60 border-slate-200 text-slate-900'
                  }`}
                >
                  {mOpt.text}
                </button>
              );
            })}
          </div>

          {selectedOpt && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-3 animate-slide-in ${
                selectedOpt.isCorrect
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              <span>{selectedOpt.feedback}</span>
              {isMicroCorrect && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMicroOptionId(null);
                    onCompleteRemediationA(
                      stepNumber,
                      remediation.substepId,
                      remediation.title,
                      step.targetEquation
                    );
                  }}
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                >
                  Вернуться на маршрут ({step.targetEquation})
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 3. RENDER STRATEGY B CONSEQUENCE DISCOVERY BRANCH VIEW
  const renderConsequenceB = (
    originStepNumber: 1 | 2 | 3,
    optionId: string,
    phase: 'step2Star' | 'step3Star' | 'step4StarCheck' | 'step5StarDetective'
  ) => {
    const originStep = scenario.steps[originStepNumber - 1];
    const consequence =
      originStep.consequencesB[optionId] ||
      Object.values(originStep.consequencesB)[0];

    return (
      <div className="rounded-2xl border-2 border-orange-500 bg-orange-50/35 p-5 space-y-5 animate-slide-in">
        {/* Top Strategy B Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-600 text-white">
                  Стратегия Б • Свободный вывод и проверка гипотезы
                </span>
              </div>
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 mt-0.5">
                Исследуем следствие из вашего уравнения:{' '}
                <span className="font-math text-orange-800">
                  {consequence.flawedEquationAtOrigin}
                </span>
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onCompareOtherStrategyWithError}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-100 text-blue-900 border border-blue-300 hover:bg-blue-200 transition cursor-pointer"
          >
            ← А как бы поступил маршрут А?
          </button>
        </div>

        {/* Phase Progress Stepper inside Strategy B Branch */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            ...(consequence.step2Star
              ? [{ key: 'step2Star', label: 'Шаг 2*. Упрощение' }]
              : []),
            { key: 'step3Star', label: 'Шаг 3*. Корень-гипотеза' },
            { key: 'step4StarCheck', label: 'Шаг 4*. Подстановка' },
            { key: 'step5StarDetective', label: 'Шаг 5*. Детектив ошибки' },
          ].map((item) => {
            const isActive = phase === item.key;
            return (
              <div
                key={item.key}
                className={`px-3 py-2 rounded-xl text-xs font-bold border text-center ${
                  isActive
                    ? 'bg-orange-600 text-white border-orange-700 shadow-2xs'
                    : 'bg-white/80 text-slate-600 border-orange-200'
                }`}
              >
                {item.label}
              </div>
            );
          })}
        </div>

        {/* PHASE: step2Star */}
        {phase === 'step2Star' && consequence.step2Star && (
          <div className="bg-white rounded-2xl p-4 border border-orange-200 space-y-4">
            <div className="text-xs text-slate-600 bg-orange-50/70 p-3 rounded-xl border border-orange-200/80">
              <strong>Особенность Стратегии Б:</strong> мы не прерываем вашу мысль сигналом ошибки!
              Давайте доведём ваше уравнение{' '}
              <span className="font-math font-bold text-slate-900">
                {consequence.step2Star.currentEquation}
              </span>{' '}
              до конца и посмотрим, выдержит ли полученный корень проверку в исходном условии.
            </div>

            <h4 className="font-display font-bold text-sm sm:text-base text-slate-900">
              {consequence.step2Star.prompt}
            </h4>

            <div className="space-y-2.5">
              {consequence.step2Star.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (opt.isCorrectForBranch) {
                      setBranchFeedback(null);
                      onAdvanceConsequenceB('step3Star');
                    } else {
                      setBranchFeedback(
                        'Для вашего текущего уравнения сложите коэффициенты при x: 3x - x = 2x.'
                      );
                    }
                  }}
                  className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50/40 transition flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div>
                    <div className="font-math text-base font-bold text-slate-900">
                      {opt.expression}
                    </div>
                    <div className="text-xs text-slate-500">{opt.actionLabel}</div>
                  </div>
                  <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                    Далее →
                  </span>
                </button>
              ))}
            </div>

            {branchFeedback && (
              <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                {branchFeedback}
              </div>
            )}
          </div>
        )}

        {/* PHASE: step3Star */}
        {phase === 'step3Star' && (
          <div className="bg-white rounded-2xl p-4 border border-orange-200 space-y-4">
            <h4 className="font-display font-bold text-sm sm:text-base text-slate-900">
              {consequence.step3Star.prompt}
            </h4>

            <div className="space-y-2.5">
              {consequence.step3Star.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (opt.isCorrectForBranch) {
                      setBranchFeedback(null);
                      onAdvanceConsequenceB('step4StarCheck');
                    } else {
                      setBranchFeedback(
                        'Перенесите свободное число в правую часть с противоположным знаком и разделите на 2.'
                      );
                    }
                  }}
                  className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50/40 transition flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div>
                    <div className="font-math text-base font-bold text-slate-900">
                      {opt.expression}
                    </div>
                    <div className="text-xs text-slate-500">{opt.actionLabel}</div>
                  </div>
                  <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                    Проверить корень →
                  </span>
                </button>
              ))}
            </div>

            {branchFeedback && (
              <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                {branchFeedback}
              </div>
            )}
          </div>
        )}

        {/* PHASE: step4StarCheck (Substitution Laboratory) */}
        {phase === 'step4StarCheck' && (
          <div className="bg-white rounded-2xl p-5 border-2 border-rose-300 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              Шаг 4*. Лаборатория проверки корня подстановкой в исходное уравнение
            </div>

            <div className="bg-rose-50/70 rounded-xl p-4 border border-rose-200 space-y-2">
              <div className="text-xs text-slate-600">
                Подставляем полученный вами корень{' '}
                <span className="font-math font-bold text-slate-900">
                  {consequence.step3Star.derivedRootExpression}
                </span>{' '}
                в <strong>исходное уравнение</strong>{' '}
                <span className="font-math font-bold text-slate-900">
                  {consequence.step4StarCheck.originalEquation}
                </span>
                :
              </div>
              <div className="font-math text-sm sm:text-base font-bold text-rose-900 bg-white px-3.5 py-2.5 rounded-lg border border-rose-200">
                {consequence.step4StarCheck.substitutedExpressionLeft}
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-rose-800 pt-1">
                <span>
                  Левая чаша = {consequence.step4StarCheck.substitutedValueLeft}
                </span>
                <span>•</span>
                <span>
                  Правая чаша = {consequence.step4StarCheck.expectedValueRight}
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-math">
                  {consequence.step4StarCheck.substitutedValueLeft} ≠{' '}
                  {consequence.step4StarCheck.expectedValueRight} (Противоречие!)
                </span>
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-900">
              {consequence.step4StarCheck.verificationPrompt}
            </p>

            <div className="space-y-2">
              {consequence.step4StarCheck.options.map((vOpt) => (
                <button
                  key={vOpt.id}
                  type="button"
                  onClick={() => {
                    if (vOpt.isCorrect) {
                      setBranchFeedback(null);
                      onAdvanceConsequenceB('step5StarDetective');
                    } else {
                      setBranchFeedback(
                        'Исходное условие задачи неизменно. Если при подстановке левая и правая части не равны, значит корень не подходит.'
                      );
                    }
                  }}
                  className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/40 text-xs sm:text-sm font-medium text-slate-800 transition flex items-center justify-between gap-3 cursor-pointer"
                >
                  <span>{vOpt.text}</span>
                  <ArrowRight className="w-4 h-4 text-rose-600 shrink-0" />
                </button>
              ))}
            </div>

            {branchFeedback && (
              <div className="text-xs text-rose-800 bg-rose-50 p-3 rounded-xl border border-rose-200">
                {branchFeedback}
              </div>
            )}
          </div>
        )}

        {/* PHASE: step5StarDetective (Pinpoint the broken step in the chain) */}
        {phase === 'step5StarDetective' && (
          <div className="bg-white rounded-2xl p-5 border-2 border-amber-400 space-y-4">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
              <SearchCheck className="w-4 h-4 text-amber-600" />
              Шаг 5*. Детектив ошибки: найдите строку, где сломалась равносильность
            </div>

            <p className="text-xs sm:text-sm text-slate-700 font-medium">
              {consequence.step5StarDetective.prompt}
            </p>

            <div className="space-y-2">
              {consequence.step5StarDetective.derivationChain.map((line, idx) => {
                const isSelected = selectedDetectiveIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDetectiveIndex(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? line.isBrokenTransition
                          ? 'bg-emerald-50 border-2 border-emerald-500'
                          : 'bg-amber-50 border-amber-300'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-500 min-w-[130px]">
                        {line.stepLabel}:
                      </span>
                      <span className="font-math text-sm sm:text-base font-bold text-slate-900">
                        {line.expression}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {isSelected
                        ? line.isBrokenTransition
                          ? 'Точка ошибки найдена! ✓'
                          : 'Проверить строку'
                        : 'Нажмите для проверки'}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedDetectiveIndex !== null && (
              <div
                className={`p-4 rounded-xl border text-xs sm:text-sm space-y-3 animate-slide-in ${
                  consequence.step5StarDetective.derivationChain[
                    selectedDetectiveIndex
                  ].isBrokenTransition
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}
              >
                <div className="font-medium">
                  {
                    consequence.step5StarDetective.derivationChain[
                      selectedDetectiveIndex
                    ].hint
                  }
                </div>

                {consequence.step5StarDetective.derivationChain[
                  selectedDetectiveIndex
                ].isBrokenTransition && (
                  <div className="pt-2 border-t border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-emerald-900">
                      <strong>Итог реконструкции:</strong>{' '}
                      {consequence.step5StarDetective.finalFixSummary}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDetectiveIndex(null);
                        onAdvanceConsequenceB('resolved');
                      }}
                      className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                    >
                      Применить исправление и завершить ({scenario.trueRootExpression})
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // 4. RENDER COMPLETED SUMMARY VIEW
  const renderCompletedView = () => {
    const hadDeviation =
      completedRemediationsA.length > 0 || visitedConsequenceBranchB !== null;

    return (
      <div className="rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-6 space-y-5 animate-slide-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Маршрут успешно пройден!
              </span>
              <h3 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900">
                Корень уравнения: <span className="font-math text-emerald-700">{scenario.trueRootExpression}</span>
              </h3>
            </div>
          </div>

          <div className="bg-white px-4 py-2.5 rounded-xl border border-emerald-200 text-right">
            <div className="text-[11px] font-bold uppercase text-slate-400">
              Проверка в исходном условии
            </div>
            <div className="font-math text-sm font-bold text-emerald-800">
              ЛЧ = {scenario.verifiedValueBothSides} | ПЧ ={' '}
              {scenario.verifiedValueBothSides} ({scenario.verifiedValueBothSides} ={' '}
              {scenario.verifiedValueBothSides})
            </div>
          </div>
        </div>

        {/* Pedagogical Summary of the Trajectory Taken */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Анализ вашей образовательной траектории ({isStrategyA ? 'Стратегия А' : 'Стратегия Б'}):
          </div>
          {hadDeviation ? (
            isStrategyA ? (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                При возникновении ошибки на промежуточном шаге <strong>Стратегия А («Направляющий тьютор»)</strong>{' '}
                мгновенно переключила маршрут в узконаправленный <strong>Подшаг микро-обучения</strong>,
                помогла отработать правило на коротком тренажёре и вернула вас к эталонному решению без искажения последующих шагов.
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                При возникновении ошибки на промежуточном шаге <strong>Стратегия Б («Исследовательское открытие»)</strong>{' '}
                позволила вам решить собственное изменённое уравнение до конца, получить гипотетический корень{' '}
                <span className="font-math font-bold">{visitedConsequenceBranchB?.derivedRootExpr}</span>,
                убедиться на алгебраических весах в противоречии{' '}
                <span className="font-math font-bold text-rose-700">({visitedConsequenceBranchB?.contradictionText})</span>{' '}
                и самостоятельно обнаружить строку, где нарушилась равносильность.
              </p>
            )
          ) : (
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Вы прошли все 3 шага безошибочно по прямому эталонному маршруту! Чтобы увидеть, как
              <strong> Стратегия А</strong> и <strong>Стратегия Б</strong> по-разному перестраивают маршрут
              при ошибке на промежуточном шаге, запустите интерактивную симуляцию ошибки ниже.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onCompareOtherStrategyWithError}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white shadow-xs transition cursor-pointer ${
              isStrategyA
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Compass className="w-4 h-4" />
            {isStrategyA
              ? 'Испытать ошибку на этом сценарии в Стратегии Б →'
              : '← Испытать ошибку на этом сценарии в Стратегии А'}
          </button>

          <button
            type="button"
            onClick={onResetScenario}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Решить сначала
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      {/* Top Notebook Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Интерактивная тетрадь решений • {scenario.gradeLevel}
          </span>
          <h2 className="font-display font-extrabold text-lg sm:text-xl text-slate-900">
            {scenario.title}
          </h2>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
          {scenario.trapHighlight}
        </span>
      </div>

      {/* Derivation Ledger */}
      {renderNotebookLedger()}

      {/* Active Stage Content */}
      {activeStage.type === 'canonical' &&
        renderCanonicalStep(activeStage.stepNumber)}
      {activeStage.type === 'remediationA' &&
        renderRemediationA(activeStage.stepNumber, activeStage.optionId)}
      {activeStage.type === 'consequenceB' &&
        renderConsequenceB(
          activeStage.originStepNumber,
          activeStage.optionId,
          activeStage.phase
        )}
      {activeStage.type === 'completed' && renderCompletedView()}
    </div>
  );
};
