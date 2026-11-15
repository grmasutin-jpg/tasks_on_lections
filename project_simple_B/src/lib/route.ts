import type { Scenario, SkillId, StrategyId } from '@/data/types';

export type NodeKind =
  | 'intro'
  | 'step'
  | 'retry'
  | 'justify'
  | 'concept'
  | 'drill'
  | 'balance'
  | 'diagnosis'
  | 'alt'
  | 'demo'
  | 'boostrap'
  | 'reflect'
  | 'finish';

export interface RouteNode {
  id: string;
  kind: NodeKind;
  title: string;
  subtitle?: string;
  stepId?: string;
  skill?: SkillId;
  next?: string;
}

export const NODE_META: Record<
  NodeKind,
  { label: string; color: string; ring: string; bg: string; icon: string }
> = {
  intro: {
    label: 'Старт',
    color: 'text-slate-300',
    ring: 'ring-slate-400/40',
    bg: 'bg-slate-400/15',
    icon: 'play',
  },
  step: {
    label: 'Шаг уравнения',
    color: 'text-indigo-200',
    ring: 'ring-indigo-400/50',
    bg: 'bg-indigo-400/15',
    icon: 'target',
  },
  retry: {
    label: 'Повтор шага',
    color: 'text-sky-200',
    ring: 'ring-sky-400/50',
    bg: 'bg-sky-400/15',
    icon: 'repeat',
  },
  justify: {
    label: 'Обоснование',
    color: 'text-cyan-200',
    ring: 'ring-cyan-400/50',
    bg: 'bg-cyan-400/15',
    icon: 'brain',
  },
  concept: {
    label: 'Правило',
    color: 'text-violet-200',
    ring: 'ring-violet-400/50',
    bg: 'bg-violet-400/15',
    icon: 'book',
  },
  drill: {
    label: 'Микро-тренажёр',
    color: 'text-fuchsia-200',
    ring: 'ring-fuchsia-400/50',
    bg: 'bg-fuchsia-400/15',
    icon: 'dumbbell',
  },
  balance: {
    label: 'Весы',
    color: 'text-amber-200',
    ring: 'ring-amber-400/50',
    bg: 'bg-amber-400/15',
    icon: 'scale',
  },
  diagnosis: {
    label: 'Диагностика',
    color: 'text-rose-200',
    ring: 'ring-rose-400/50',
    bg: 'bg-rose-400/15',
    icon: 'stethoscope',
  },
  alt: {
    label: 'Другой метод',
    color: 'text-emerald-200',
    ring: 'ring-emerald-400/50',
    bg: 'bg-emerald-400/15',
    icon: 'graph',
  },
  demo: {
    label: 'Разбор решения',
    color: 'text-teal-200',
    ring: 'ring-teal-400/50',
    bg: 'bg-teal-400/15',
    icon: 'sparkles',
  },
  boostrap: {
    label: 'Экспресс-повтор',
    color: 'text-violet-200',
    ring: 'ring-violet-400/50',
    bg: 'bg-violet-400/15',
    icon: 'zap',
  },
  reflect: {
    label: 'Рефлексия',
    color: 'text-pink-200',
    ring: 'ring-pink-400/50',
    bg: 'bg-pink-400/15',
    icon: 'heart',
  },
  finish: {
    label: 'Итоги',
    color: 'text-emerald-200',
    ring: 'ring-emerald-400/50',
    bg: 'bg-emerald-400/15',
    icon: 'trophy',
  },
};

/**
 * Строит граф маршрута для выбранной стратегии.
 *
 * Базовая цепочка одинакова: intro → step₁ → step₂ → … → finish.
 * Разница — в том, что происходит после ОШИБКИ на промежуточном шаге:
 *
 *  Стратегия А («Лестница подсказок»):
 *      step → Правило → Микро-тренажёр → Повтор шага → Весы → следующий шаг
 *      (маршрут удлиняется, метод остаётся алгебраическим)
 *
 *  Стратегия Б («Смена метода»):
 *      step → Диагностика → Графический метод → Разбор решения → Рефлексия → Финиш
 *      (алгебраические шаги отменяются, метод меняется целиком)
 */
export function buildRoute(scenario: Scenario, strategy: StrategyId): Record<string, RouteNode> {
  const nodes: Record<string, RouteNode> = {};
  const steps = scenario.steps;
  const add = (node: RouteNode) => {
    nodes[node.id] = node;
  };

  const stepBase = (i: number): string =>
    i === steps.length - 1
      ? strategy === 'A'
        ? 'boostrap'
        : 'reflect'
      : `step:${steps[i + 1].id}`;

  add({ id: 'intro', kind: 'intro', title: 'Сценарий', subtitle: scenario.title });

  steps.forEach((step, i) => {
    const afterStep = strategy === 'A' ? stepBase(i) : `justify:${step.id}`;

    add({
      id: `step:${step.id}`,
      kind: 'step',
      title: step.title,
      subtitle: step.goal,
      stepId: step.id,
      skill: step.skill,
      next: afterStep,
    });

    if (strategy === 'A') {
      add({
        id: `concept:${step.id}`,
        kind: 'concept',
        title: 'Правило: ' + step.title,
        subtitle: step.skill,
        stepId: step.id,
        skill: step.skill,
        next: `drill:${step.id}`,
      });
      add({
        id: `drill:${step.id}`,
        kind: 'drill',
        title: 'Микро-тренажёр',
        subtitle: step.skill,
        stepId: step.id,
        skill: step.skill,
        next: `retry:${step.id}`,
      });
      const retryNext = step.balance ? `balance:${step.id}` : afterStep;
      add({
        id: `retry:${step.id}`,
        kind: 'retry',
        title: 'Повтор: ' + step.title,
        subtitle: step.skill,
        stepId: step.id,
        skill: step.skill,
        next: retryNext,
      });
      if (step.balance) {
        add({
          id: `balance:${step.id}`,
          kind: 'balance',
          title: 'Весы: равновесие',
          subtitle: step.skill,
          stepId: step.id,
          skill: step.skill,
          next: afterStep,
        });
      }
    } else {
      add({
        id: `justify:${step.id}`,
        kind: 'justify',
        title: 'Обоснуй выбор',
        subtitle: step.skill,
        stepId: step.id,
        skill: step.skill,
        next: i === steps.length - 1 ? 'reflect' : `step:${steps[i + 1].id}`,
      });
      add({
        id: `diagnosis:${step.id}`,
        kind: 'diagnosis',
        title: 'Разбор ошибки',
        subtitle: step.skill,
        stepId: step.id,
        skill: step.skill,
        next: `alt:${scenario.id}`,
      });
    }
  });

  if (strategy === 'A') {
    add({
      id: 'boostrap',
      kind: 'boostrap',
      title: 'Экспресс-повтор',
      subtitle: scenario.coreSkill,
      skill: scenario.coreSkill,
      next: 'finish',
    });
  } else {
    add({
      id: `alt:${scenario.id}`,
      kind: 'alt',
      title: 'Графический метод',
      subtitle: 'Другой способ решить то же уравнение',
      skill: scenario.coreSkill,
      next: 'reflect',
    });
    add({
      id: `demo:${scenario.id}`,
      kind: 'demo',
      title: 'Разбор решения',
      subtitle: 'Пошагово, целиком',
      next: 'reflect',
    });
    add({ id: 'reflect', kind: 'reflect', title: 'Рефлексия', next: 'finish' });
  }

  add({ id: 'finish', kind: 'finish', title: 'Итоги' });

  nodes['intro'].next = `step:${steps[0].id}`;

  return nodes;
}

/** Куда уводит ошибка на шаге при выбранной стратегии. */
export function branchAfterError(strategy: StrategyId, stepId: string): string {
  return strategy === 'A' ? `concept:${stepId}` : `diagnosis:${stepId}`;
}

/** Человекочитаемая цепочка ветки — используется в подсказках и в отчёте. */
export function branchPreview(strategy: StrategyId): string[] {
  return strategy === 'A'
    ? ['Правило', 'Микро-тренажёр', 'Повтор шага', 'Весы', 'Дальше по плану']
    : ['Диагностика', 'Графический метод', 'Разбор решения', 'Рефлексия', 'Финиш'];
}

export const STRATEGIES: Record<
  StrategyId,
  {
    id: StrategyId;
    name: string;
    tagline: string;
    color: string;
    accent: string;
    idea: string[];
    onError: string;
    errorRoute: string[];
    pros: string[];
    cons: string[];
  }
> = {
  A: {
    id: 'A',
    name: 'Лестница подсказок',
    tagline: 'Разобрать навык и пройти шаг заново',
    color: 'text-violet-200',
    accent: 'from-violet-500/25 to-indigo-500/10',
    idea: [
      'Каждая ошибка превращается в правило + короткий микро-тренажёр именно на этот навык.',
      'Шаг возвращается в маршрут: ученик решает его снова и закрепляет на весах.',
      'Маршрут становится длиннее, но метод решения остаётся прежним.',
    ],
    onError: 'Маршрут удлиняется: правило → микро-задачи → повтор шага → весы → дальше по плану.',
    errorRoute: ['Правило', 'Микро-тренажёр', 'Повтор шага', 'Весы', 'Следующий шаг'],
    pros: ['Навык реально закрепляется', 'Ошибка не сбивает с толку', 'Мягкий вход в тему'],
    cons: ['Маршрут длиннее', 'Иногда хочется сменить способ'],
  },
  B: {
    id: 'B',
    name: 'Смена метода',
    tagline: 'Понять идею иначе, через график',
    color: 'text-emerald-200',
    accent: 'from-emerald-500/25 to-teal-500/10',
    idea: [
      'После ошибки алгебраический маршрут отменяется — остаются шаги до ошибки.',
      'Уравнение решается другим способом: графики двух частей и точка пересечения.',
      'Каждый шаг требует обоснования «почему», а не только ответа.',
    ],
    onError: 'Маршрут меняется методом: диагностика → график → разбор → рефлексия → финиш.',
    errorRoute: ['Диагностика', 'Графический метод', 'Разбор решения', 'Рефлексия', 'Финиш'],
    pros: ['Свежий взгляд на уравнение', 'Понятна сама идея', 'Короткий маршрут после ошибки'],
    cons: ['Алгебру приходится доводить позже', 'Нужна готовность работать с графиком'],
  },
};
