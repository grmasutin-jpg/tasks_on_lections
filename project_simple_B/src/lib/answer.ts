/** Приводит ответ ученика к каноническому виду для сравнения. */
export function normalizeAnswer(raw: string): string {
  let s = (raw ?? '').trim().toLowerCase();
  s = s.replace(/[\u2212\u2013\u2014]/g, '-'); // типографские минусы
  s = s.replace(/[\u00d7\u22c5\u00b7]/g, '*'); // × · •
  s = s.replace(/\u2153/g, '1/3').replace(/\u2154/g, '2/3').replace(/\u2152/g, '3/4'); // ⅓ ⅔ ¾
  s = s.replace(/[\u00ab\u00bb"']/g, '');
  s = s.replace(/\u0445/g, 'x'); // кириллическая «х»
  s = s.replace(/\s+/g, '');
  s = s.replace(/,/g, '.'); // десятичная запятая
  s = s.replace(/\*/g, ''); // неявное умножение
  s = s.replace(/\.$/, '');
  return s;
}

function isNumeric(s: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(s);
}

/** Сравнивает две части равенства без учёта их порядка. */
function sameEquation(a: string, b: string): boolean {
  if (!a.includes('=') || !b.includes('=')) return false;
  const [al, ar] = a.split('=');
  const [bl, br] = b.split('=');
  const sameSide = (x: string, y: string) => x === y || x === '-' + y || '-' + x === y;
  return (sameSide(al, bl) && sameSide(ar, br)) || (sameSide(al, br) && sameSide(ar, bl));
}

export function checkAnswer(
  given: string,
  expected: string,
  accepts: string[] = [],
): boolean {
  const g = normalizeAnswer(given);
  if (!g) return false;
  const candidates = [expected, ...accepts].map(normalizeAnswer).filter(Boolean);

  if (candidates.includes(g)) return true;

  // Числовой ответ: допускаем 8 и 8.0
  const gNum = Number(g);
  if (Number.isFinite(gNum) && g !== '' && !Number.isNaN(gNum)) {
    for (const c of candidates) {
      if (isNumeric(c) && Math.abs(Number(c) - gNum) < 1e-9) return true;
    }
  }

  // Равенство: 2x+6=3x-6+4  и  3x-6+4=2x+6 — одно и то же
  for (const c of candidates) {
    if (sameEquation(g, c)) return true;
  }

  return false;
}

/** Подсказка «почему неверно» — сравнивает ответ с ожидаемым и ищет типичную ошибку. */
export function diffFeedback(
  given: string,
  expected: string,
): { kind: 'sign' | 'order' | 'partial' | 'generic'; text: string } {
  const g = normalizeAnswer(given);
  const e = normalizeAnswer(expected);
  if (!g) return { kind: 'generic', text: 'Пока ничего не введено — запиши свою версию уравнения.' };
  if (g.includes('(') && e.includes('(') === false) {
    return {
      kind: 'partial',
      text: 'Похоже, скобки ещё не раскрыты. На этом шаге они уже не нужны.',
    };
  }
  const gSigns = (g.match(/-/g) ?? []).length;
  const eSigns = (e.match(/-/g) ?? []).length;
  if (gSigns !== eSigns) {
    return {
      kind: 'sign',
      text: 'Похоже, затерялся знак «минус». Перечитай условие шага и посчитай знаки ещё раз.',
    };
  }
  if (g.replace(/[-+]/g, '') !== e.replace(/[-+]/g, '')) {
    return {
      kind: 'order',
      text: 'Числа похожие, но не все. Проверь, какие слагаемые ты перенёс и в какую сторону.',
    };
  }
  return {
    kind: 'generic',
    text: 'Пока не то. Сравни каждый член уравнения с ожидаемым и попробуй снова.',
  };
}
