import type { StrategyId } from '@/data/types';

export interface StepRecord {
  attempts: number;
  errors: number;
  hints: number;
  solved: boolean;
  errored: boolean;
}

export interface WrongEntry {
  nodeId: string;
  title: string;
  given: string;
  expected: string;
  at: number;
}

export interface RunState {
  scenarioId: string;
  strategy: StrategyId;
  current: string;
  visited: string[];
  metrics: {
    attempts: number;
    correct: number;
    errors: number;
    hints: number;
    branches: number;
    startedAt: number;
    finishedAt?: number;
  };
  steps: Record<string, StepRecord>;
  wrong: WrongEntry[];
  drillIndex: Record<string, number>;
  drillStatus: Record<string, 'idle' | 'ok' | 'bad' | 'revealed'>;
  failCount: Record<string, number>;
  altState: Record<string, { x: number | null; y: number | null; found: boolean; failed: boolean }>;
  reflect: { choice: string | null; text: string };
  finished: boolean;
}

export type RunAction =
  | { type: 'start'; scenarioId: string; strategy: StrategyId }
  | { type: 'goto'; nodeId: string }
  | {
      type: 'attempt';
      nodeId: string;
      title: string;
      given: string;
      expected: string;
      correct: boolean;
      stepId?: string;
      hintLevel?: number;
    }
  | { type: 'hint'; nodeId: string; stepId?: string }
  | { type: 'drill'; nodeId: string; index: number; status: 'idle' | 'ok' | 'bad' | 'revealed' }
  | { type: 'fail'; nodeId: string }
  | { type: 'alt'; nodeId: string; x: number | null; y: number | null; found: boolean }
  | { type: 'reflect'; choice?: string | null; text?: string }
  | { type: 'finish' };

export function createRun(scenarioId: string, strategy: StrategyId): RunState {
  return {
    scenarioId,
    strategy,
    current: 'intro',
    visited: ['intro'],
    metrics: {
      attempts: 0,
      correct: 0,
      errors: 0,
      hints: 0,
      branches: 0,
      startedAt: Date.now(),
    },
    steps: {},
    wrong: [],
    drillIndex: {},
    drillStatus: {},
    failCount: {},
    altState: {},
    reflect: { choice: null, text: '' },
    finished: false,
  };
}

export function runReducer(state: RunState, action: RunAction): RunState {
  switch (action.type) {
    case 'start':
      return createRun(action.scenarioId, action.strategy);

    case 'goto': {
      if (action.nodeId === state.current) return state;
      const visited = [...state.visited, action.nodeId];
      const isBranch =
        state.current.startsWith('step:') &&
        (action.nodeId.startsWith('concept:') || action.nodeId.startsWith('diagnosis:'));
      return {
        ...state,
        current: action.nodeId,
        visited,
        metrics: isBranch ? { ...state.metrics, branches: state.metrics.branches + 1 } : state.metrics,
      };
    }

    case 'attempt': {
      const steps = { ...state.steps };
      if (action.stepId) {
        const prev: StepRecord = steps[action.stepId] ?? {
          attempts: 0,
          errors: 0,
          hints: 0,
          solved: false,
          errored: false,
        };
        steps[action.stepId] = {
          ...prev,
          attempts: prev.attempts + 1,
          errors: prev.errors + (action.correct ? 0 : 1),
          hints: Math.max(prev.hints, action.hintLevel ?? prev.hints),
          solved: prev.solved || action.correct,
          errored: prev.errored || !action.correct,
        };
      }
      return {
        ...state,
        steps,
        wrong: action.correct
          ? state.wrong
          : [
              ...state.wrong,
              {
                nodeId: action.nodeId,
                title: action.title,
                given: action.given,
                expected: action.expected,
                at: Date.now(),
              },
            ],
        metrics: {
          ...state.metrics,
          attempts: state.metrics.attempts + 1,
          correct: state.metrics.correct + (action.correct ? 1 : 0),
          errors: state.metrics.errors + (action.correct ? 0 : 1),
        },
      };
    }

    case 'hint': {
      const steps = { ...state.steps };
      if (action.stepId) {
        const prev: StepRecord = steps[action.stepId] ?? {
          attempts: 0,
          errors: 0,
          hints: 0,
          solved: false,
          errored: false,
        };
        steps[action.stepId] = { ...prev, hints: prev.hints + 1 };
      }
      return {
        ...state,
        steps,
        metrics: { ...state.metrics, hints: state.metrics.hints + 1 },
      };
    }

    case 'drill':
      return {
        ...state,
        drillIndex: { ...state.drillIndex, [action.nodeId]: action.index },
        drillStatus: { ...state.drillStatus, [action.nodeId]: action.status },
      };

    case 'fail':
      return {
        ...state,
        failCount: { ...state.failCount, [action.nodeId]: (state.failCount[action.nodeId] ?? 0) + 1 },
      };

    case 'alt': {
      const prev = state.altState[action.nodeId] ?? { x: null, y: null, found: false, failed: false };
      return {
        ...state,
        altState: {
          ...state.altState,
          [action.nodeId]: {
            x: action.x,
            y: action.y,
            found: action.found || prev.found,
            failed: !action.found || prev.failed,
          },
        },
      };
    }

    case 'reflect':
      return {
        ...state,
        reflect: {
          choice: action.choice !== undefined ? action.choice : state.reflect.choice,
          text: action.text !== undefined ? action.text : state.reflect.text,
        },
      };

    case 'finish':
      return {
        ...state,
        finished: true,
        metrics: { ...state.metrics, finishedAt: Date.now() },
      };

    default:
      return state;
  }
}
