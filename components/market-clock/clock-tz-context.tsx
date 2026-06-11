"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type DisplayTz = "ET" | "TR";

interface ClockTzCtx {
  displayTz: DisplayTz;
  toggleTz: () => void;
}

const ClockTzContext = createContext<ClockTzCtx>({ displayTz: "ET", toggleTz: () => {} });

export function ClockTzProvider({ children }: { children: ReactNode }) {
  const [displayTz, setDisplayTz] = useState<DisplayTz>("ET");

  useEffect(() => {
    const saved = localStorage.getItem("mkt-clock-tz");
    if (saved === "TR" || saved === "ET") setDisplayTz(saved);
  }, []);

  const toggleTz = useCallback(() => {
    setDisplayTz((prev) => {
      const next: DisplayTz = prev === "ET" ? "TR" : "ET";
      localStorage.setItem("mkt-clock-tz", next);
      return next;
    });
  }, []);

  return <ClockTzContext.Provider value={{ displayTz, toggleTz }}>{children}</ClockTzContext.Provider>;
}

export function useClockTz() {
  return useContext(ClockTzContext);
}
