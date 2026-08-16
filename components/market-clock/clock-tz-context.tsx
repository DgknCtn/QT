"use client";

import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react";
import { useStoredValue, writeStoredValue } from "@/lib/use-stored-value";

export type DisplayTz = "ET" | "TR";

const STORAGE_KEY = "mkt-clock-tz";

interface ClockTzCtx {
  displayTz: DisplayTz;
  toggleTz: () => void;
}

const ClockTzContext = createContext<ClockTzCtx>({ displayTz: "ET", toggleTz: () => {} });

export function ClockTzProvider({ children }: { children: ReactNode }) {
  const stored = useStoredValue(STORAGE_KEY, "ET");
  const displayTz: DisplayTz = stored === "TR" ? "TR" : "ET";

  const toggleTz = useCallback(() => {
    writeStoredValue(STORAGE_KEY, displayTz === "ET" ? "TR" : "ET");
  }, [displayTz]);

  const value = useMemo(() => ({ displayTz, toggleTz }), [displayTz, toggleTz]);

  return <ClockTzContext.Provider value={value}>{children}</ClockTzContext.Provider>;
}

export function useClockTz() {
  return useContext(ClockTzContext);
}
