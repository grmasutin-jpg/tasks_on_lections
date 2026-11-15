/**
 * Мини-парсер линейных выражений вида a·x + b.
 * Проверяет ответы ученика без eval и без внешних библиотек.
 */

export interface Lin {
  /** коэффициент при x */
  a: number;
  /** свободный член */
  b: number;
}

export interface Equation {
  lhs: Lin;
  rhs: Lin;
  /** все числа, которые ученик записал (нужно для проверки подстановки) */
  literals: number[];
}

export class MathInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MathInputError';
  }
}

type Token =
  | { t: 'num'; v: number }
  | { t: 'x' }
  | { t: 'op'; v: '+' | '-' | '*' | '/' }
  | { t: 'lp' }
  | { t: 'rp' }
  | { t: 'eq' };

const EPS = 1e-9;

export function isClose(p: number, q: number): boolean {
  return Math.abs(p - q) < EPS;
}

export function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}

/** Приводит ввод к единому виду: нижний регистр, без пробелов, знаки ×, ÷, − и т.п. */
export function normalizeInput(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\u0445/g, 'x') // русская «х» → латинская x
    .replace(/[×·⋅•]/g, '*')
    .replace(/[÷:]/g, '/')
    .replace(/[−–—]/g, '-')
    .replace(/,/g, '.');
}

function tokenize(raw: string): Token[] {
  const s = normalizeInput(raw);
  if (s.length === 0) {
    throw new MathInputError('Ответ пустой. Введите уравнение или число.');
  }
  const out: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const txt = s.slice(i, j);
      if (!/^\d+(\.\d+)?$/.test(txt)) {
        throw new MathInputError(`Некорректное число «${txt}». Пишите числа, например 8 или 2.5.`);
      }
      out.push({ t: 'num', v: Number(txt) });
      i = j;
      continue;
    }
    if (c === 'x') out.push({ t: 'x' });
    else if (c === '+' || c === '-' || c === '*' || c === '/') out.push({ t: 'op', v: c as '+' | '-' | '*' | '/' });
    else if (c === '(') out.push({ t: 'lp' });
    else if (c === ')') out.push({ t: 'rp' });
    else if (c === '=') out.push({ t: 'eq' });
    else if (/[a-zа-яё]/i.test(c)) {
      throw new MathInputError(`Буква «${c}» здесь не подходит. Вместо букв используйте только x — неизвестное число.`);
    } else {
      throw new MathInputError(`Символ «${c}» не распознан. Используйте числа, x, знаки + − × ÷, скобки и знак =.`);
    }
    i++;
  }
  return out;
}

function mul(p: Lin, q: Lin): Lin {
  if (!isClose(p.a, 0) && !isClose(q.a, 0)) {
    throw new MathInputError('Уравнение должно быть линейным: x нельзя умножать на x.');
  }
  return { a: p.a * q.b + q.a * p.b, b: p.b * q.b };
}

function div(p: Lin, q: Lin): Lin {
  if (!isClose(q.a, 0)) throw new MathInputError('Нельзя делить на выражение с x.');
  if (isClose(q.b, 0)) throw new MathInputError('Деление на ноль невозможно.');
  return { a: p.a / q.b, b: p.b / q.b };
}

class Parser {
  private pos = 0;

  constructor(private readonly toks: Token[]) {}

  atEnd(): boolean {
    return this.pos >= this.toks.length;
  }

  private peek(): Token | undefined {
    return this.toks[this.pos];
  }

  private isOp(v: '+' | '-' | '*' | '/'): boolean {
    const p = this.peek();
    return !!p && p.t === 'op' && p.v === v;
  }

  private startsFactor(): boolean {
    const p = this.peek();
    return !!p && (p.t === 'num' || p.t === 'x' || p.t === 'lp');
  }

  parseExpr(): Lin {
    let v = this.parseTerm();
    while (this.isOp('+') || this.isOp('-')) {
      const plus = this.isOp('+');
      this.pos++;
      const r = this.parseTerm();
      v = plus ? { a: v.a + r.a, b: v.b + r.b } : { a: v.a - r.a, b: v.b - r.b };
    }
    return v;
  }

  private parseTerm(): Lin {
    let v = this.parseUnary();
    for (;;) {
      if (this.isOp('*') || this.isOp('/')) {
        const times = this.isOp('*');
        this.pos++;
        const r = this.parseUnary();
        v = times ? mul(v, r) : div(v, r);
      } else if (this.startsFactor()) {
        // неявное умножение: 2x, 2(x + 3)
        v = mul(v, this.parseUnary());
      } else {
        break;
      }
    }
    return v;
  }

  private parseUnary(): Lin {
    if (this.isOp('-')) {
      this.pos++;
      const v = this.parseUnary();
      return { a: -v.a, b: -v.b };
    }
    if (this.isOp('+')) {
      this.pos++;
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Lin {
    const p = this.peek();
    if (!p) throw new MathInputError('Выражение не закончено.');
    if (p.t === 'num') {
      this.pos++;
      return { a: 0, b: p.v };
    }
    if (p.t === 'x') {
      this.pos++;
      return { a: 1, b: 0 };
    }
    if (p.t === 'lp') {
      this.pos++;
      const v = this.parseExpr();
      const q = this.peek();
      if (!q || q.t !== 'rp') throw new MathInputError('Не хватает закрывающей скобки «)».');
      this.pos++;
      return v;
    }
    throw new MathInputError('В выражении лишний или пропущенный знак. Проверьте запись.');
  }
}

function parseSide(tokens: Token[]): Lin {
  if (tokens.length === 0) {
    throw new MathInputError('Одна из частей пустая. Запишите выражения слева и справа от знака «=».');
  }
  const p = new Parser(tokens);
  const v = p.parseExpr();
  if (!p.atEnd()) throw new MathInputError('В выражении есть лишний символ. Проверьте запись.');
  return v;
}

/** Разбирает выражение без знака «=» (например, «3x + 6»). */
export function parseExpression(raw: string): Lin {
  const toks = tokenize(raw);
  if (toks.some((t) => t.t === 'eq')) {
    throw new MathInputError('Здесь нужно записать только выражение, без знака «=».');
  }
  return parseSide(toks);
}

/** Разбирает равенство вида «L = R». */
export function parseEquation(raw: string): Equation {
  const toks = tokenize(raw);
  const count = toks.filter((t) => t.t === 'eq').length;
  if (count === 0) throw new MathInputError('Запишите ответ в виде равенства со знаком «=», например: 2x = 8.');
  if (count > 1) throw new MathInputError('Знак «=» должен быть только один.');
  const k = toks.findIndex((t) => t.t === 'eq');
  return {
    lhs: parseSide(toks.slice(0, k)),
    rhs: parseSide(toks.slice(k + 1)),
    literals: toks.flatMap((t) => (t.t === 'num' ? [t.v] : [])),
  };
}

export function sameLin(p: Lin, q: Lin): boolean {
  return isClose(p.a, q.a) && isClose(p.b, q.b);
}

/** Равенства совпадают, если совпадают стороны (порядок сторон не важен). */
export function sameEquation(eq: Equation, exp: Equation): boolean {
  return (
    (sameLin(eq.lhs, exp.lhs) && sameLin(eq.rhs, exp.rhs)) ||
    (sameLin(eq.lhs, exp.rhs) && sameLin(eq.rhs, exp.lhs))
  );
}
