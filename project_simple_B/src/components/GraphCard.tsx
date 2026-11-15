import { useRef, useState } from 'react';
import type { GraphSpec } from '@/data/types';
import { Icon } from './Icon';

interface GraphCardProps {
  spec: GraphSpec;
  failCount: number;
  onCheck: (x: number, y: number | null) => boolean;
  onFail: () => void;
  onComplete: () => void;
  onShowDemo: () => void;
}

const W = 520;
const H = 330;
const M = { l: 48, r: 20, t: 20, b: 42 };
const PLOT_W = W - M.l - M.r;
const PLOT_H = H - M.t - M.b;

export function GraphCard({
  spec,
  failCount,
  onCheck,
  onFail,
  onComplete,
  onShowDemo,
}: GraphCardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const [input, setInput] = useState('');
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState(false);

  const sx = (x: number) => M.l + ((x - spec.xMin) / (spec.xMax - spec.xMin)) * PLOT_W;
  const sy = (y: number) => H - M.b - ((y - spec.yMin) / (spec.yMax - spec.yMin)) * PLOT_H;
  const ix = (px: number) => spec.xMin + ((px - M.l) / PLOT_W) * (spec.xMax - spec.xMin);
  const iy = (py: number) => spec.yMin + ((H - M.b - py) / PLOT_H) * (spec.yMax - spec.yMin);

  const linePath = (m: number, b: number) => {
    const pts: string[] = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const x = spec.xMin + ((spec.xMax - spec.xMin) * i) / steps;
      pts.push(`${sx(x).toFixed(2)},${sy(m * x + b).toFixed(2)}`);
    }
    return `M ${pts.join(' L ')}`;
  };

  const toGraphPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * W;
    const py = ((clientY - rect.top) / rect.height) * H;
    return { x: ix(px), y: iy(py) };
  };

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (solved) return;
    const p = toGraphPoint(e.clientX, e.clientY);
    if (p) setMarker(p);
  };

  const check = () => {
    let x: number | null = null;
    if (input.trim()) {
      const parsed = Number(input.replace(',', '.'));
      if (!Number.isFinite(parsed)) return;
      x = parsed;
    } else if (marker) {
      x = marker.x;
    }
    if (x === null) return;
    const tolX = Math.max(0.25, (spec.xMax - spec.xMin) * 0.02);
    const ok = Math.abs(x - spec.solution.x) <= tolX;
    if (ok) {
      setSolved(true);
      setWrong(false);
      onCheck(spec.solution.x, spec.solution.y);
    } else {
      setWrong(true);
      onFail();
    }
  };

  const xRange = spec.xMax - spec.xMin;
  const yRange = spec.yMax - spec.yMin;
  const xStep = xRange > 24 ? 5 : xRange > 14 ? 2 : 1;
  const yStep = yRange > 40 ? 10 : yRange > 20 ? 5 : yRange > 10 ? 2 : 1;

  const xTicks: number[] = [];
  for (let x = Math.ceil(spec.xMin); x <= spec.xMax; x++) xTicks.push(x);
  const yTicks: number[] = [];
  for (let y = Math.ceil(spec.yMin); y <= spec.yMax; y++) yTicks.push(y);

  return (
    <div className="anim-fade-up space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30">
          <Icon name="graph" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
            Другой метод
          </p>
          <h2 className="text-xl font-bold text-white">Графики двух частей</h2>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-slate-200">{spec.task}</p>

      <div className="glass overflow-hidden rounded-2xl p-3 sm:p-4">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none select-none"
          onPointerDown={handlePointer}
          onPointerMove={(e) => {
            if (e.buttons === 1) handlePointer(e);
          }}
        >
          <defs>
            <clipPath id="mp-plot">
              <rect x={M.l} y={M.t} width={PLOT_W} height={PLOT_H} rx="10" />
            </clipPath>
          </defs>
          <rect x={M.l} y={M.t} width={PLOT_W} height={PLOT_H} fill="#0b1024" rx="10" />

          {xTicks.map((x) => (
            <g key={`x${x}`}>
              <line
                x1={sx(x)}
                y1={M.t}
                x2={sx(x)}
                y2={H - M.b}
                stroke="rgba(255,255,255,0.055)"
                strokeWidth="1"
              />
              {x % xStep === 0 && (
                <text
                  x={sx(x)}
                  y={H - M.b + 16}
                  fill="rgba(203,213,225,0.6)"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {x}
                </text>
              )}
            </g>
          ))}
          {yTicks.map((y) => (
            <g key={`y${y}`}>
              <line
                x1={M.l}
                y1={sy(y)}
                x2={M.l + PLOT_W}
                y2={sy(y)}
                stroke="rgba(255,255,255,0.055)"
                strokeWidth="1"
              />
              {y % yStep === 0 && (
                <text
                  x={M.l - 8}
                  y={sy(y) + 3.5}
                  fill="rgba(203,213,225,0.6)"
                  fontSize="10"
                  textAnchor="end"
                >
                  {y}
                </text>
              )}
            </g>
          ))}

          {spec.yMin <= 0 && spec.yMax >= 0 && (
            <line
              x1={M.l}
              y1={sy(0)}
              x2={M.l + PLOT_W}
              y2={sy(0)}
              stroke="rgba(226,232,240,0.55)"
              strokeWidth="1.4"
            />
          )}
          {spec.xMin <= 0 && spec.xMax >= 0 && (
            <line
              x1={sx(0)}
              y1={M.t}
              x2={sx(0)}
              y2={H - M.b}
              stroke="rgba(226,232,240,0.55)"
              strokeWidth="1.4"
            />
          )}

          <path
            d={linePath(spec.line1.m, spec.line1.b)}
            stroke={spec.line1.color}
            strokeWidth="2.6"
            fill="none"
            clipPath="url(#mp-plot)"
          />
          <path
            d={linePath(spec.line2.m, spec.line2.b)}
            stroke={spec.line2.color}
            strokeWidth="2.6"
            fill="none"
            clipPath="url(#mp-plot)"
          />

          {solved && (
            <>
              <circle
                cx={sx(spec.solution.x)}
                cy={sy(spec.solution.y)}
                r="9"
                fill="rgba(16,185,129,0.25)"
                stroke="#34d399"
                strokeWidth="2"
              />
              <text
                x={sx(spec.solution.x) + 12}
                y={sy(spec.solution.y) - 10}
                fill="#6ee7b7"
                fontSize="13"
                fontWeight="700"
              >
                ({spec.solution.x}; {spec.solution.y})
              </text>
            </>
          )}

          {marker && !solved && (
            <g>
              <line
                x1={sx(marker.x)}
                y1={M.t}
                x2={sx(marker.x)}
                y2={H - M.b}
                stroke="rgba(255,255,255,0.35)"
                strokeDasharray="4 4"
              />
              <line
                x1={M.l}
                y1={sy(marker.y)}
                x2={M.l + PLOT_W}
                y2={sy(marker.y)}
                stroke="rgba(255,255,255,0.35)"
                strokeDasharray="4 4"
              />
              <circle cx={sx(marker.x)} cy={sy(marker.y)} r="7" fill="#fbbf24" stroke="#fff" strokeWidth="1.5" />
            </g>
          )}
        </svg>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-2 text-indigo-200">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: spec.line1.color }} />
            {spec.line1.label}
          </span>
          <span className="inline-flex items-center gap-2 text-emerald-200">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: spec.line2.color }} />
            {spec.line2.label}
          </span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setWrong(false);
          }}
          placeholder="x = (или поставь точку на графике)"
          autoComplete="off"
          className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3.5 font-mono text-lg text-white outline-none transition placeholder:font-sans placeholder:text-sm placeholder:text-slate-500 focus:ring-2 ${
            wrong
              ? 'border-rose-400/60 focus:ring-rose-400/40'
              : 'border-white/10 focus:border-emerald-400/60 focus:ring-emerald-400/40'
          }`}
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98]"
        >
          Проверить
        </button>
      </form>

      {wrong && (
        <p className="anim-shake rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          Точка не та. Поищи, где прямые пересекаются: в этой точке обе части уравнения равны.
        </p>
      )}

      {solved && (
        <div className="anim-pop space-y-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <p className="text-sm font-bold text-emerald-100">
            Точка пересечения найдена: x = {spec.solution.x}
          </p>
          <p className="text-sm leading-relaxed text-emerald-50/85">
            В точке пересечения обе части равны — значит, это и есть корень. Графический метод
            «показывает» решение целиком, без переносов.
          </p>
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-emerald-950 transition hover:bg-emerald-400"
          >
            К рефлексии
            <Icon name="arrowRight" className="h-4 w-4" />
          </button>
        </div>
      )}

      {!solved && failCount >= 2 && (
        <button
          type="button"
          onClick={onShowDemo}
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
        >
          <Icon name="book" className="h-4 w-4" />
          Показать решение по шагам
        </button>
      )}
    </div>
  );
}
