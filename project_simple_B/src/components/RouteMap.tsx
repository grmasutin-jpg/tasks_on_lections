import type { RouteNode } from '@/lib/route';
import { NODE_META } from '@/lib/route';
import type { StepRecord } from '@/lib/run';
import { Icon, type IconName } from './Icon';

interface RouteMapProps {
  route: Record<string, RouteNode>;
  visited: string[];
  steps: Record<string, StepRecord>;
}

const BRANCH_KINDS = new Set(['concept', 'drill', 'balance', 'diagnosis', 'alt', 'demo']);

export function RouteMap({ route, visited, steps }: RouteMapProps) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="route" className="h-4 w-4 text-indigo-300" />
        <h3 className="text-sm font-bold text-white">Карта маршрута</h3>
        <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
          {visited.length} узлов
        </span>
      </div>

      <ol className="relative space-y-1.5 pl-1">
        <span className="absolute bottom-3 left-[15px] top-3 w-px bg-gradient-to-b from-indigo-400/40 via-white/10 to-transparent" />
        {visited.map((id, i) => {
          const node = route[id];
          if (!node) return null;
          const meta = NODE_META[node.kind];
          const isCurrent = i === visited.length - 1;
          const record = node.stepId ? steps[node.stepId] : undefined;
          const hasError = node.kind === 'step' && record?.errored;
          const isBranch = BRANCH_KINDS.has(node.kind);

          return (
            <li key={id + i} className="anim-fade-up relative flex items-start gap-3">
              <span
                className={`relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-[#080c1a] ${meta.bg} ${meta.ring} ${meta.color} ${
                  isCurrent ? 'anim-pulse' : ''
                }`}
              >
                <Icon name={meta.icon as IconName} className="h-3.5 w-3.5" />
              </span>
              <div
                className={`min-w-0 flex-1 rounded-xl px-3 py-2 ${
                  isCurrent ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white/[0.03]'
                }`}
              >
                <p className="flex items-center gap-2 text-[13px] font-semibold leading-tight text-white">
                  <span className="truncate">{node.title}</span>
                  {hasError && (
                    <span className="shrink-0 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-200">
                      ошибка
                    </span>
                  )}
                  {isBranch && (
                    <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                      ветка
                    </span>
                  )}
                </p>
                <p className={`text-[11px] font-medium ${meta.color}`}>{meta.label}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
