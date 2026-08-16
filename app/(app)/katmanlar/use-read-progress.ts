"use client";

import { useCallback, useMemo } from "react";
import { useIsHydrated, useStoredValue, writeStoredValue } from "@/lib/use-stored-value";

const STORAGE_KEY = "katmanlar-progress";

/**
 * Okunmuş bölüm id'lerini localStorage'da tutan hook.
 *
 * localStorage doğrudan kaynak: `useStoredValue` sunucu anlık görüntüsü olarak
 * boş listeyi döndürdüğü için hydration uyuşur, ardından React gerçek değerle
 * yeniden render eder. Eski "useEffect içinde oku + setState" deseni cascading
 * render tetikliyordu.
 */
export function useReadProgress() {
  const ready = useIsHydrated();
  const raw = useStoredValue(STORAGE_KEY, "[]");

  const read = useMemo<Set<string>>(() => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? new Set(parsed as string[]) : new Set();
    } catch {
      // yoksay — bozuk/erişilemez storage
      return new Set();
    }
  }, [raw]);

  const persist = useCallback((next: Set<string>) => {
    writeStoredValue(STORAGE_KEY, JSON.stringify([...next]));
  }, []);

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(read);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeStoredValue(STORAGE_KEY, JSON.stringify([...next]));
    },
    [read]
  );

  const isRead = useCallback((id: string) => ready && read.has(id), [ready, read]);

  const countRead = useCallback(
    (ids: string[]) => (ready ? ids.filter((id) => read.has(id)).length : 0),
    [ready, read]
  );

  return { ready, isRead, toggle, countRead, persist };
}
