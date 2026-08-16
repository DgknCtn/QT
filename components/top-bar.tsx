"use client";

import { usePathname } from "next/navigation";
import { Plus, Sun, Moon, Menu } from "lucide-react";
import Link from "next/link";
import { MarketClockCompact } from "@/components/market-clock/market-clock-compact";
import { useTheme } from "@/components/theme-provider";
import { findNavItem } from "@/lib/nav";

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const navItem  = findNavItem(pathname);
  const title    = navItem?.hideTopBarTitle ? "" : navItem?.label ?? "";
  const quickAdd = navItem?.quickAdd;

  return (
    <header className="flex items-center justify-between px-4 md:px-6 border-b border-app bg-elevated shrink-0" style={{ height: 56 }}>
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          aria-label="Menüyü aç"
          className="md:hidden p-1.5 rounded-lg text-muted hover-surface transition-colors"
        >
          <Menu size={16} />
        </button>
        <h1 className="text-sm font-semibold text-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <MarketClockCompact />
        {quickAdd && (
          <Link
            href={quickAdd.href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            <Plus size={12} />
            {quickAdd.label}
          </Link>
        )}
        <button
          onClick={toggle}
          aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
          title={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
          className="p-1.5 rounded-lg text-muted hover-surface transition-colors"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
