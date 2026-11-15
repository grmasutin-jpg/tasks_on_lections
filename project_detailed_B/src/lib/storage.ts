/**
 * Безопасная работа с LocalStorage.
 * Если хранилище недоступно (приватный режим, запрет в браузере),
 * сайт продолжает работать, а данные живут только в памяти вкладки.
 */

const STORAGE_KEY = 'mathpath:v1';

function probe(): boolean {
  try {
    const k = 'mathpath:probe';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export const storageAvailable: boolean = probe();

let memoryValue: string | null = null;

export function readStorage(): string | null {
  if (!storageAvailable) return memoryValue;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryValue;
  }
}

/** Возвращает false, если сохранить не удалось. */
export function writeStorage(value: string): boolean {
  memoryValue = value;
  if (!storageAvailable) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
    return true;
  } catch {
    return false;
  }
}
