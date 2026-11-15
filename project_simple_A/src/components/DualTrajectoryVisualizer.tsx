import React from 'react';
import {
  ShieldCheck,
  Compass,
  CornerDownRight,
  Scale,
  CheckCircle2,
  Sparkles,
  Play,
} from 'lucide-react';
import { EquationScenario, StrategyType } from '../data/scenarios';

interface DualTrajectoryVisualizerProps {
  scenario: EquationScenario;
  activeStrategy: StrategyType;
  onSimulateStrategyError: (strategy: StrategyType, stepNum: 1 | 2) => void;
}

export const DualTrajectoryVisualizer: React.FC<DualTrajectoryVisualizerProps> = ({
  scenario,
  activeStrategy,
  onSimulateStrategyError,
}) => {
  const step1 = scenario.steps[0];
  const step2 = scenario.steps[1];
  const step3 = scenario.steps[2];

  const wrongOpt1 = step1.options.find((o) => !o.isCorrect) || step1.options[1];
  const remA1 = step1.remediationsA[wrongOpt1.id] || Object.values(step1.remediationsA)[0];
  const consB1 = step1.consequencesB[wrongOpt1.id] || Object.values(step1.consequencesB)[0];

  return (
    <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Наглядная схема ветвления • Единый сценарий «{scenario.originalEquation}»
          </span>
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 mt-1">
            Две стратегии обучения при ошибке на промежуточном шаге
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Допустим, на <strong>Шаге 1</strong> при раскрытии скобок в уравнении{' '}
            <span className="font-math font-bold text-slate-900">
              {scenario.originalEquation}
            </span>{' '}
            ученик совершает типичную ошибку:{' '}
            <span className="font-math font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              {wrongOpt1.expression}
            </span>
            . Посмотрите, как по-разному перестраивается маршрут:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSimulateStrategyError('strategyA', 1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Демо ошибки в Стратегии А
          </button>
          <button
            type="button"
            onClick={() => onSimulateStrategyError('strategyB', 1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-2xs transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Демо ошибки в Стратегии Б
          </button>
        </div>
      </div>

      {/* Side-by-side Trajectory Blueprints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blueprint A */}
        <div
          className={`rounded-2xl p-5 border-2 transition ${
            activeStrategy === 'strategyA'
              ? 'bg-blue-50/35 border-blue-500 shadow-xs'
              : 'bg-[#FAF8F5] border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Стратегия А: «Направляющий тьютор»
                </h3>
                <p className="text-xs text-blue-800 font-medium">
                  Локальная петля микро-коррекции без искажения дальнейших шагов
                </p>
              </div>
            </div>
            {activeStrategy === 'strategyA' && (
              <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-600 text-white">
                Выбрана
              </span>
            )}
          </div>

          {/* Trajectory Flow A */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
              <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-math font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900">
                  Ошибка на Шаге 1:{' '}
                  <span className="font-math text-rose-700">{wrongOpt1.expression}</span>
                </div>
                <div className="text-slate-500">
                  Система перехватывает ошибку до перехода к Шагу 2
                </div>
              </div>
            </div>

            {/* Detour Loop */}
            <div className="ml-5 pl-4 border-l-2 border-blue-500 space-y-2 py-1">
              <div className="bg-blue-600 text-white p-3 rounded-xl shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <CornerDownRight className="w-4 h-4 text-blue-200 shrink-0" />
                  <span>Вставка узла «Подшаг {remA1.substepId}: Разбор ловушки»</span>
                </div>
                <p className="text-blue-100 text-[11px] mt-1">
                  Визуализация правила знаков + контрольный мини-тренажёр на аналогичном выражении (
                  <span className="font-math font-semibold">
                    {remA1.microQuestion.expressionToTransform}
                  </span>
                  ).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900">
                  Возврат на Шаг 1 ({step1.targetEquation}) → Шаг 2 ({step2.targetEquation}) → Шаг 3 ({step3.targetEquation})
                </div>
                <div className="text-slate-500">
                  Ученик продолжает решать исходное уравнение по чистому эталонному маршруту
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-600">
              Можно также протестировать ошибку на Шаге 2:
            </span>
            <button
              type="button"
              onClick={() => onSimulateStrategyError('strategyA', 2)}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline cursor-pointer"
            >
              Симулировать ошибку Шага 2 в Стратегии А
            </button>
          </div>
        </div>

        {/* Blueprint B */}
        <div
          className={`rounded-2xl p-5 border-2 transition ${
            activeStrategy === 'strategyB'
              ? 'bg-orange-50/35 border-orange-500 shadow-xs'
              : 'bg-[#FAF8F5] border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Стратегия Б: «Исследовательское открытие»
                </h3>
                <p className="text-xs text-orange-800 font-medium">
                  Пересчёт дальнейшего маршрута под гипотезу ученика до проверки весами
                </p>
              </div>
            </div>
            {activeStrategy === 'strategyB' && (
              <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-orange-600 text-white">
                Выбрана
              </span>
            )}
          </div>

          {/* Trajectory Flow B */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
              <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-math font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900">
                  Ошибка на Шаге 1:{' '}
                  <span className="font-math text-orange-800">{wrongOpt1.expression}</span>
                </div>
                <div className="text-slate-500">
                  Система принимает уравнение как рабочую гипотезу без подсказки об ошибке
                </div>
              </div>
            </div>

            {/* Consequence Branch */}
            <div className="ml-5 pl-4 border-l-2 border-orange-500 space-y-2 py-1">
              <div className="bg-orange-600 text-white p-3 rounded-xl shadow-2xs">
                <div className="flex items-center justify-between gap-2 font-bold">
                  <span>
                    Ветка следствия: Шаг 2* ({consB1.step2Star?.targetExpression}) → Шаг 3* (
                    {consB1.step3Star.derivedRootExpression})
                  </span>
                </div>
                <p className="text-orange-100 text-[11px] mt-1">
                  Все последующие шаги динамически перестраиваются под уравнение ученика, приводя к
                  гипотетическому корню <strong className="font-math">{consB1.step3Star.derivedRootExpression}</strong>.
                </p>
              </div>

              <div className="bg-rose-50 border border-rose-300 text-rose-950 p-2.5 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Шаг 4* (Подстановка в исходное):</strong> весы показывают дисбаланс{' '}
                    <span className="font-math font-bold text-rose-700">
                      {consB1.step4StarCheck.substitutedValueLeft} ≠{' '}
                      {consB1.step4StarCheck.expectedValueRight}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-emerald-300">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900">
                  Шаг 5* («Детектив ошибки») → Реконструкция и выход на{' '}
                  <span className="font-math text-emerald-700">{scenario.trueRootExpression}</span>
                </div>
                <div className="text-slate-500">
                  Ученик сам находит строку с нарушением равносильности и исправляет цепочку
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-orange-200/60 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-600">
              Можно также протестировать ошибку на Шаге 2:
            </span>
            <button
              type="button"
              onClick={() => onSimulateStrategyError('strategyB', 2)}
              className="text-xs font-semibold text-orange-700 hover:text-orange-900 underline cursor-pointer"
            >
              Симулировать ошибку Шага 2 в Стратегии Б
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
