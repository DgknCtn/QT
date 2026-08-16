"use client";

import { createContext, useContext, useEffect } from "react";
import { useStoredValue, writeStoredValue } from "@/lib/use-stored-value";

type Theme = "dark" | "light";

const STORAGE_KEY = "qt-theme";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const stored = useStoredValue(STORAGE_KEY, "dark");
  const theme: Theme = stored === "light" ? "light" : "dark";

  // Mirroring state onto the <html> element is a genuine external side effect,
  // so it belongs in an effect. The inline script in app/layout.tsx sets this
  // before hydration; this keeps it in sync on later changes.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggle() {
    writeStoredValue(STORAGE_KEY, theme === "dark" ? "light" : "dark");
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
