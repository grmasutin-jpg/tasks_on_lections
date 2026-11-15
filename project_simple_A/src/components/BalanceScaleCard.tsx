import React from 'react';
import { Scale, CheckCircle2, AlertTriangle, Sparkles, Compass } from 'lucide-react';
import { StrategyType } from '../data/scenarios';

interface BalanceScaleCardProps {
  strategy: StrategyType;
  leftExpression: string;
  rightExpression: string;
  mode: 'balanced' | 'remediationA' | 'hypothesisB' | 'contradictionB' | 'solved';
  leftNumericValue?: number;
  rightNumericValue?: number;
  statusCaption: string;
}

export const BalanceScaleCard: React.FC<BalanceScaleCardProps> = ({
  strategy,
  leftExpression,
  rightExpression,
  mode,
  leftNumericValue,
  rightNumericValue,
  statusCaption,
}) => {
  // Calculate beam tilt angle in degrees
  let tiltAngle = 0;
  if (mode === 'contradictionB') {
    const l = leftNumericValue ?? -4;
    const r = rightNumericValue ?? 4;
    tiltAngle = l < r ? 11 : -11;
  } else if (mode === 'remediationA') {
    tiltAngle = -5;
  }

  const getBadgeConfig = () => {
    switch (mode) {
      case 'solved':
        return {
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-800',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
          label: 'Тождество подтверждено: чаши в идеальном равновесии',
        };
      case 'remediationA':
        return {
          bg: 'bg-blue-50 border-blue-300 text-blue-900',
          icon: <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />,
          label: 'Стратегия А: Мгновенный перехват ошибки до искажения ответа',
        };
      case 'hypothesisB':
        return {
          bg: 'bg-orange-50 border-orange-300 text-orange-900',
          icon: <Compass className="w-4 h-4 text-orange-600 shrink-0" />,
          label: 'Стратегия Б: Проверка рабочей гипотезы (вывод следствия)',
        };
      case 'contradictionB':
        return {
          bg: 'bg-rose-50 border-rose-300 text-rose-900',
          icon: <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />,
          label: `Дисбаланс при подстановке: ${leftNumericValue} ≠ ${rightNumericValue}`,
        };
      default:
        return {
          bg: 'bg-slate-100 border-slate-200 text-slate-700',
          icon: <Scale className="w-4 h-4 text-slate-600 shrink-0" />,
          label: 'Равносильное состояние: Левая часть = Правая часть',
        };
    }
  };

  const badge = getBadgeConfig();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              strategy === 'strategyA'
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'bg-orange-50 text-orange-600 border border-orange-200'
            }`}
          >
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Алгебраические весы равносильности
            </h4>
            <p className="text-xs text-slate-600">{statusCaption}</p>
          </div>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bg}`}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </div>
      </div>

      {/* SVG Precision Scale Visualization */}
      <div className="relative bg-[#FAF8F5] rounded-xl border border-slate-200/70 px-4 py-3 overflow-hidden">
        <div className="grid grid-cols-12 items-center gap-2">
          {/* Left Pan Info */}
          <div className="col-span-4 text-center">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">
              Левая чаша (ЛЧ)
            </span>
            <div
              className={`font-math text-sm sm:text-base font-semibold px-2.5 py-1.5 rounded-lg border inline-block max-w-full truncate ${
                mode === 'contradictionB'
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : mode === 'solved'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {leftExpression}
            </div>
            {mode === 'contradictionB' && leftNumericValue !== undefined && (
              <div className="mt-1 text-xs font-math font-bold text-rose-600">
                Значение: {leftNumericValue}
              </div>
            )}
          </div>

          {/* Center SVG Fulcrum & Beam */}
          <div className="col-span-4 flex flex-col items-center justify-center">
            <svg
              viewBox="0 0 180 76"
              className="w-full max-w-[175px] h-[68px] overflow-visible"
              aria-label="Весы уравнения"
            >
              {/* Base pedestal */}
              <path
                d="M70 70 L110 70 L96 42 L84 42 Z"
                fill="#E2E8F0"
                stroke="#64748B"
                strokeWidth="1.5"
              />
              <line
                x1="56"
                y1="71"
                x2="124"
                y2="71"
                stroke="#475569"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Rotating Beam Group */}
              <g
                style={{
                  transform: `rotate(${tiltAngle}deg)`,
                  transformOrigin: '90px 38px',
                  transition: 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                {/* Main crossbeam */}
                <line
                  x1="22"
                  y1="38"
                  x2="158"
                  y2="38"
                  stroke={
                    mode === 'contradictionB'
                      ? '#E11D48'
                      : mode === 'solved'
                      ? '#16A34A'
                      : strategy === 'strategyA'
                      ? '#2563EB'
                      : '#EA580C'
                  }
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Left pan hanger */}
                <line x1="26" y1="38" x2="16" y2="55" stroke="#64748B" strokeWidth="1.4" />
                <line x1="26" y1="38" x2="36" y2="55" stroke="#64748B" strokeWidth="1.4" />
                <path
                  d="M11 55 Q26 62 41 55"
                  fill="none"
                  stroke={mode === 'contradictionB' ? '#E11D48' : '#334155'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Right pan hanger */}
                <line x1="154" y1="38" x2="144" y2="55" stroke="#64748B" strokeWidth="1.4" />
                <line x1="154" y1="38" x2="164" y2="55" stroke="#64748B" strokeWidth="1.4" />
                <path
                  d="M139 55 Q154 62 169 55"
                  fill="none"
                  stroke={mode === 'contradictionB' ? '#E11D48' : '#334155'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </g>

              {/* Center pivot circle */}
              <circle
                cx="90"
                cy="38"
                r="6"
                fill="#FFFFFF"
                stroke={
                  mode === 'contradictionB'
                    ? '#E11D48'
                    : mode === 'solved'
                    ? '#16A34A'
                    : '#1E293B'
                }
                strokeWidth="2.5"
              />

              {/* Equality or Inequality symbol floating above pivot */}
              <text
                x="90"
                y="22"
                textAnchor="middle"
                className="font-math font-bold text-sm"
                fill={
                  mode === 'contradictionB'
                    ? '#E11D48'
                    : mode === 'remediationA'
                    ? '#D97706'
                    : mode === 'solved'
                    ? '#16A34A'
                    : '#1E293B'
                }
              >
                {mode === 'contradictionB' ? '≠' : mode === 'remediationA' ? '?!' : '='}
              </text>
            </svg>
          </div>

          {/* Right Pan Info */}
          <div className="col-span-4 text-center">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">
              Правая чаша (ПЧ)
            </span>
            <div
              className={`font-math text-sm sm:text-base font-semibold px-2.5 py-1.5 rounded-lg border inline-block max-w-full truncate ${
                mode === 'contradictionB'
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : mode === 'solved'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {rightExpression}
            </div>
            {mode === 'contradictionB' && rightNumericValue !== undefined && (
              <div className="mt-1 text-xs font-math font-bold text-slate-700">
                Ожидалось: {rightNumericValue}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
