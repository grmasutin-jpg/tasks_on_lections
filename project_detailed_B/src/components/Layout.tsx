import type { ReactNode } from 'react';
import type { Navigate, Route } from '@/hooks/useRoute';
import { cn } from '@/utils/cn';

const NAV: { to: Route; label: string }[] = [
  { to: '/', label: 'Главная' },
  { to: '/learn', label: 'Обучение' },
  { to: '/compare', label: 'Сравнение' },
  { to: '/results', label: 'Результаты' },
];

export function Layout({
  route,
  navigate,
  children,
}: {
  route: Route;
  navigate: Navigate;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-violet-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 rounded-xl focus-visible:outline-2 focus-visible:outline-violet-500"
            aria-label="MathPath — на главную"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-bold text-white shadow-md shadow-violet-300/60">
              x
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              Math<span className="text-violet-600">Path</span>
            </span>
          </button>
          <nav className="flex w-full gap-1 overflow-x-auto sm:w-auto" aria-label="Основная навигация">
            {NAV.map((item) => (
              <button
                key={item.to}
                type="button"
                onClick={() => navigate(item.to)}
                aria-current={route === item.to ? 'page' : undefined}
                className={cn(
                  'whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition',
                  route === item.to
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-300/50'
                    : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700',
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">{children}</main>
      <footer className="border-t border-violet-100 py-6 text-center text-sm text-slate-500">
        MathPath · тренажёр линейных уравнений · работает в браузере, без регистрации и сервера
      </footer>
    </div>
  );
}
