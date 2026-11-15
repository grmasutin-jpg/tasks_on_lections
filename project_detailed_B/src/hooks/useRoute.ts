import { useEffect, useState } from 'react';

/** Маршрутизация по хешу (#/learn), чтобы работать на статическом хостинге без серверных правил */
export const ROUTES = ['/', '/learn', '/compare', '/results'] as const;
export type Route = (typeof ROUTES)[number];
export type Navigate = (r: Route) => void;

function readRoute(): Route {
  const h = window.location.hash.replace(/^#/, '') || '/';
  return (ROUTES as readonly string[]).includes(h) ? (h as Route) : '/';
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate: Navigate = (r) => {
    if (window.location.hash !== `#${r}`) window.location.hash = r;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { route, navigate };
}
