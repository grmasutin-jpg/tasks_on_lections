import React from 'react';
import {
  X,
  ShieldCheck,
  Compass,
  ArrowRight,
  CornerDownRight,
  Scale,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { EquationScenario, StrategyType } from '../data/scenarios';

interface StrategyComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: EquationScenario;
  onLaunchDemoWithError: (strategy: StrategyType) => void;
}

export const StrategyComparisonModal: React.FC<StrategyComparisonModalProps> = ({
  isOpen,
  onClose,
  scenario,
  onLaunchDemoWithError,
}) => {
  if (!isOpen) return null;

  const step1 = scenario.steps[0];
  const wrongOption = step1.options.find((o) => !o.isCorrect) || step1.options[1];
  const remediationA = step1.remediationsA[wrongOption.id];
  const consequenceB = step1.consequencesB[wrongOption.id];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-slide-in">
      <div className="bg-[#FAF8F5] rounded-3xl border border-slate-200 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Педагогическая архитектура MathPath
            </span>
            <h2 className="font-display font-extrabold text-lg sm:text-xl text-slate-900">
              Как одна и та же ошибка по-разному меняет маршрут ученика
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Common Scenario Context Banner */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Единый сценарий и единая точка ошибки (Шаг 1)
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-math text-sm sm:text-base font-bold bg-slate-900 text-white px-3 py-1 rounded-lg">
                  {scenario.originalEquation}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="font-math text-sm sm:text-base font-bold bg-rose-50 text-rose-800 border border-rose-300 px-3 py-1 rounded-lg">
                  Ошибка ученика: {wrongOption.expression}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5">
                Суть ошибки: <strong className="text-slate-900">{wrongOption.errorTitle}</strong> —{' '}
                {wrongOption.diagnosticSummary}
              </p>
            </div>
            <div className="shrink-0 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 text-right">
              <div className="text-[11px] font-semibold text-emerald-700 uppercase">
                Эталонный шаг 1
              </div>
              <div className="font-math text-sm font-bold text-emerald-900">
                {step1.targetEquation}
              </div>
            </div>
          </div>

          {/* Two Columns: Strategy A vs Strategy B */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strategy A Card */}
            <div className="bg-white rounded-2xl border-2 border-blue-500/80 shadow-sm flex flex-col justify-between overflow-hidden">
              <div>
                <div className="bg-blue-600 text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-6 h-6 text-blue-100" />
                    <div>
                      <div className="text-[11px] uppercase tracking-wider font-bold text-blue-200">
                        Стратегия А • Guided Scaffolding
                      </div>
                      <h3 className="font-display font-bold text-base">
                        «Направляющий тьютор»
                      </h3>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">
                    Мгновенная петля
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Система <strong>не позволяет</strong> ученику тянуть ошибочное уравнение дальше.
                    Маршрут мгновенно сворачивает в <strong>боковую петлю микро-обучения</strong>.
                  </p>

                  {/* Route Steps Diagram A */}
                  <div className="space-y-2.5 bg-blue-50/50 p-4 rounded-xl border border-blue-200/80">
                    <div className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-2">
                      Как меняется маршрут ученика:
                    </div>

                    <div className="flex items-start gap-2.5 text-xs">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 mt-0.5">
                        !
                      </span>
                      <div>
                        <span className="font-bold text-slate-900">Стоп на Шаге 1:</span> блокировка
                        перехода к Шагу 2 с неверным уравнением{' '}
                        <span className="font-math font-semibold text-rose-700">
                          {wrongOption.expression}
                        </span>
                        .
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs pl-4 border-l-2 border-blue-500 ml-2 py-1">
                      <CornerDownRight className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-blue-900">
                          Вставка узла «{remediationA?.title || 'Подшаг 1.1'}»:
                        </span>{' '}
                        наглядное правило знаков + мини-тренажёр на аналогичном примере{' '}
                        <span className="font-math font-semibold bg-white px-1.5 py-0.5 rounded border border-blue-200">
                          {remediationA?.microQuestion.expressionToTransform}
                        </span>
                        .
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900">
                          Возврат на Шаг 1 → Шаг 2 → Шаг 3:
                        </span>{' '}
                        ученик исправляет Шаг 1 на{' '}
                        <span className="font-math font-semibold text-emerald-800">
                          {step1.targetEquation}
                        </span>{' '}
                        и идёт по эталонному пути к <span className="font-math font-bold">{scenario.trueRootExpression}</span>.
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <strong className="text-slate-700">Кому подходит лучше всего:</strong> ученикам,
                    осваивающим новую тему, чтобы не формировать ложных автоматизмов и не тратить силы
                    на громоздкие вычисления из неверной посылки.
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  type="button"
                  onClick={() => {
                    onLaunchDemoWithError('strategyA');
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Испытать ошибку в Стратегии А («Направляющий тьютор»)
                </button>
              </div>
            </div>

            {/* Strategy B Card */}
            <div className="bg-white rounded-2xl border-2 border-orange-500/80 shadow-sm flex flex-col justify-between overflow-hidden">
              <div>
                <div className="bg-orange-600 text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-6 h-6 text-orange-100" />
                    <div>
                      <div className="text-[11px] uppercase tracking-wider font-bold text-orange-200">
                        Стратегия Б • Productive Failure
                      </div>
                      <h3 className="font-display font-bold text-base">
                        «Исследовательское открытие»
                      </h3>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">
                    Ветка следствия
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Система <strong>принимает гипотезу ученика</strong> и перестраивает следующие шаги
                    под его изменённое уравнение, позволяя дойти до корня и увидеть противоречие на весах!
                  </p>

                  {/* Route Steps Diagram B */}
                  <div className="space-y-2.5 bg-orange-50/50 p-4 rounded-xl border border-orange-200/80">
                    <div className="text-xs font-bold text-orange-950 uppercase tracking-wider mb-2">
                      Как меняется маршрут ученика:
                    </div>

                    <div className="flex items-start gap-2.5 text-xs">
                      <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center shrink-0 mt-0.5">
                        2*
                      </span>
                      <div>
                        <span className="font-bold text-slate-900">
                          Динамический пересчёт Шага 2* и 3*:
                        </span>{' '}
                        ученик решает <em>своё</em> уравнение{' '}
                        <span className="font-math font-semibold text-orange-900">
                          {wrongOption.expression}
                        </span>{' '}
                        →{' '}
                        <span className="font-math font-semibold">
                          {consequenceB?.step2Star?.targetExpression}
                        </span>{' '}
                        и находит корень-следствие{' '}
                        <span className="font-math font-bold text-orange-800">
                          {consequenceB?.step3Star.derivedRootExpression}
                        </span>
                        .
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs pl-4 border-l-2 border-rose-500 ml-2 py-1">
                      <Scale className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-rose-900">
                          Шаг 4*. Лаборатория проверки подстановкой:
                        </span>{' '}
                        корень <span className="font-math font-bold">{consequenceB?.step3Star.derivedRootExpression}</span> подставляется в исходное уравнение → весы показывают{' '}
                        <span className="font-math font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                          {consequenceB?.step4StarCheck.substitutedValueLeft} ≠{' '}
                          {consequenceB?.step4StarCheck.expectedValueRight}
                        </span>
                        !
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900">
                          Шаг 5*. Детектив ошибки и коррекция:
                        </span>{' '}
                        ученик сам находит строку в цепочке, где сломалось равенство, и выходит на истинный корень{' '}
                        <span className="font-math font-bold text-emerald-700">
                          {scenario.trueRootExpression}
                        </span>
                        .
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <strong className="text-slate-700">Кому подходит лучше всего:</strong> для
                    развития математического мышления, привычки проверять свой ответ подстановкой и
                    понимания, почему правила преобразований вообще работают.
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  type="button"
                  onClick={() => {
                    onLaunchDemoWithError('strategyB');
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  Испытать ошибку в Стратегии Б («Исследовательское открытие»)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
