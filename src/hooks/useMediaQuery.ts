import { useState, useEffect } from 'react';

/** Responsive breakpoint hooks for MARSWALK mobile-first layout */

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** phone < 640px */
export const useIsPhone = () => useMediaQuery('(max-width: 639px)');
/** tablet 640-1024 */
export const useIsTablet = () => useMediaQuery('(min-width: 640px) and (max-width: 1024px)');
/** desktop > 1024 */
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)');
/** any touch-primary device */
export const useIsTouchDevice = () => useMediaQuery('(pointer: coarse)');
