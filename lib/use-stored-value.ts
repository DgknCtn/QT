"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * localStorage-backed state without a setState-in-effect.
 *
 * The old pattern (read localStorage inside `useEffect`, then `setState`)
 * triggers a cascading render and is flagged by `react-hooks/set-state-in-effect`.
 * `useSyncExternalStore` is the sanctioned replacement: React renders the server
 * snapshot during hydration -- so markup matches -- then immediately re-renders
 * with the real stored value.
 */

const listeners = new Set<() => void>();

/** The `storage` event only fires in *other* tabs, so same-tab writes fan out here. */
function emit() {
  for (const l of listeners) l();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Writes a value and notifies every `useStoredValue` reader in this tab. */
export function writeStoredValue(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode / quota: keep the in-memory value, just don't persist.
  }
  emit();
}

/**
 * False during SSR and the hydration render, true afterwards -- the
 * `useSyncExternalStore` equivalent of the old `const [mounted, setMounted]`
 * effect, without the setState.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

/** Tracks a CSS media query without a setState-in-effect. */
export function useMediaQuery(query: string, serverFallback = false): boolean {
  const subscribeToQuery = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => serverFallback, [serverFallback]);

  return useSyncExternalStore(subscribeToQuery, getSnapshot, getServerSnapshot);
}

/** Reads a raw string from localStorage, falling back before hydration. */
export function useStoredValue(key: string, fallback: string): string {
  const getSnapshot = useCallback(() => {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }, [key, fallback]);

  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
