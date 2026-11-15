import { useEffect, useState } from 'react';
import { autoRun, createRun, submitAnswer, type RunState, type Strategy } from '@/lib/engine';
import { MAIN_STEPS, REMEDIAL, type RemedialId } from '@/lib/scenario';
import { readStorage, storageAvailable, writeStorage } from '@/lib/storage';

export interface CompareResult {
  at: number;
  simulate: boolean;
  runs: Record<Strategy, RunState>;
}

export interface ScenarioResult {
  at: number;
  /** ключи: A-off, A-on, B-off, B-on */
  runs: Record<string, RunState>;
}

export interface AppData {
  version: 1;
  selected: Strategy;
  runs: Record<Strategy, RunState>;
  simulateCompare: boolean;
  compare: CompareResult | null;
  scenario: ScenarioResult | null;
  history: RunState[];
}

const HISTORY_LIMIT = 30;

function isValidRun(r: unknown): r is RunState {
  if (!r || typeof r !== 'object') return false;
  const x = r as RunState;
  if (x.strategy !== 'A' && x.strategy !== 'B') return false;
  if (!Array.isArray(x.route) || !Array.isArray(x.completed) || !Array.isArray(x.remedialDone)) return false;
  if (typeof x.errors !== 'number' || typeof x.stepIndex !== 'number' || !MAIN_STEPS[x.stepIndex]) return false;
  if (x.phase === 'remedial') {
    const mod = REMEDIAL[x.remedialModule as RemedialId];
    if (!mod || !mod.tasks[x.remedialIndex]) return false;
  }
  return x.phase === 'main' || x.phase === 'remedial' || x.phase === 'done';
}

function defaultData(): AppData {
  return {
    version: 1,
    selected: 'A',
    runs: { A: createRun('A', false), B: createRun('B', false) },
    simulateCompare: true,
    compare: null,
    scenario: null,
    history: [],
  };
}

function loadData(): { data: AppData; restored: boolean } {
  const fallback = defaultData();
  try {
    const raw = readStorage();
    if (!raw) return { data: fallback, restored: false };
    const p = JSON.parse(raw) as Partial<AppData>;
    if (p.version !== 1 || !p.runs || !isValidRun(p.runs.A) || !isValidRun(p.runs.B)) {
      return { data: fallback, restored: false };
    }
    const data: AppData = {
      version: 1,
      selected: p.selected === 'B' ? 'B' : 'A',
      runs: { A: p.runs.A, B: p.runs.B },
      simulateCompare: typeof p.simulateCompare === 'boolean' ? p.simulateCompare : true,
      compare: p.compare && isValidRun(p.compare.runs?.A) && isValidRun(p.compare.runs?.B) ? p.compare : null,
      scenario:
        p.scenario && p.scenario.runs && Object.values(p.scenario.runs).every(isValidRun) ? p.scenario : null,
      history: Array.isArray(p.history) ? p.history.filter(isValidRun).slice(0, HISTORY_LIMIT) : [],
    };
    const restored = (['A', 'B'] as Strategy[]).some(
      (s) => data.runs[s].phase !== 'done' && data.runs[s].route.length > 1,
    );
    return { data, restored };
  } catch {
    return { data: fallback, restored: false };
  }
}

export function useMathPath() {
  const [boot] = useState(loadData);
  const [data, setData] = useState<AppData>(boot.data);
  const [restored, setRestored] = useState<boolean>(boot.restored);
  const [storageOk, setStorageOk] = useState<boolean>(storageAvailable);

  useEffect(() => {
    if (!writeStorage(JSON.stringify(data))) setStorageOk(false);
  }, [data]);

  const selectStrategy = (s: Strategy) => setData((d) => ({ ...d, selected: s }));

  const setSimulate = (s: Strategy, simulate: boolean) =>
    setData((d) => ({ ...d, runs: { ...d.runs, [s]: createRun(s, simulate) } }));

  const restartRun = (s: Strategy) =>
    setData((d) => ({ ...d, runs: { ...d.runs, [s]: createRun(s, d.runs[s].simulate) } }));

  const submit = (s: Strategy, raw: string, key?: string) =>
    setData((d) => {
      const prev = d.runs[s];
      const next = submitAnswer(prev, raw, key);
      const finishedNow = prev.phase !== 'done' && next.phase === 'done';
      const history =
        finishedNow && !d.history.some((h) => h.id === next.id)
          ? [next, ...d.history].slice(0, HISTORY_LIMIT)
          : d.history;
      return { ...d, runs: { ...d.runs, [s]: next }, history };
    });

  const setSimulateCompare = (v: boolean) => setData((d) => ({ ...d, simulateCompare: v }));

  const runComparison = () =>
    setData((d) => ({
      ...d,
      compare: {
        at: Date.now(),
        simulate: d.simulateCompare,
        runs: { A: autoRun('A', d.simulateCompare), B: autoRun('B', d.simulateCompare) },
      },
    }));

  const runScenario = () =>
    setData((d) => ({
      ...d,
      scenario: {
        at: Date.now(),
        runs: {
          'A-off': autoRun('A', false),
          'A-on': autoRun('A', true),
          'B-off': autoRun('B', false),
          'B-on': autoRun('B', true),
        },
      },
    }));

  const clearStats = () => setData((d) => ({ ...d, history: [], compare: null, scenario: null }));

  const dismissRestored = () => setRestored(false);

  return {
    data,
    storageOk,
    restored,
    dismissRestored,
    selectStrategy,
    setSimulate,
    restartRun,
    submit,
    setSimulateCompare,
    runComparison,
    runScenario,
    clearStats,
  };
}

export type Store = ReturnType<typeof useMathPath>;
