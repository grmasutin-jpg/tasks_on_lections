export type StrategyId = 'A' | 'B';

export type SkillId =
  | 'distribute'
  | 'combine'
  | 'transfer'
  | 'multiply'
  | 'divide'
  | 'verify';

export interface Drill {
  prompt: string;
  answer: string;
  accepts?: string[];
  hint: string;
}

export interface Mistake {
  text: string;
  explanation: string;
}

export interface SkillInfo {
  id: SkillId;
  title: string;
  rule: string;
  body: string;
  drills: Drill[];
  mistakes: Mistake[];
}

export interface BalanceSpec {
  left: string[];
  right: string[];
  targetLeft: string[];
  targetRight: string[];
  caption: string;
}

export interface JustifySpec {
  question: string;
  options: string[];
  correct: number;
  feedback: string;
}

export interface ScenarioStep {
  id: string;
  title: string;
  goal: string;
  /** Уравнение в начале шага. */
  state: string;
  answer: string;
  accepts?: string[];
  hints: [string, string, string];
  explain: string;
  skill: SkillId;
  balance?: BalanceSpec;
  justify: JustifySpec;
}

export interface GraphLine {
  m: number;
  b: number;
  label: string;
  color: string;
}

export interface GraphSpec {
  line1: GraphLine;
  line2: GraphLine;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  solution: { x: number; y: number };
  task: string;
}

export interface Scenario {
  id: string;
  title: string;
  topic: string;
  difficulty: 'Легко' | 'Средне' | 'Сложно';
  equation: string;
  intro: string;
  root: string;
  coreSkill: SkillId;
  steps: ScenarioStep[];
  solution: string[];
  graph: GraphSpec;
}
