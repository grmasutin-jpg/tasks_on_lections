import type { StrategyId } from '@/data/types';

export interface RunSummary {
  scenarioId: string;
  strategy: StrategyId;
  visited: string[];
  errors: number;
  hints: number;
  branches: number;
  durationMs: number;
  finishedAt: number;
}

const HISTORY_KEY = 'mathpath.history.v1';
const RUN_KEY = 'mathpath.run.v1';

export function loadHistory(): RunSummary[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RunSummary[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRunSummary(summary: RunSummary): RunSummary[] {
  const history = loadHistory().filter(
    (h) => !(h.scenarioId === summary.scenarioId && h.strategy === summary.strategy),
  );
  history.push(summary);
  const next = history.slice(-12);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
  return next;
}

export function latestFor(history: RunSummary[], scenarioId: string, strategy: StrategyId) {
  return [...history]
    .reverse()
    .find((h) => h.scenarioId === scenarioId && h.strategy === strategy);
}

export function persistRun(state: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RUN_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function clearPersistedRun(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(RUN_KEY);
  } catch {
    /* ignore */
  }
}

export function readPersistedRun<T>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(RUN_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
