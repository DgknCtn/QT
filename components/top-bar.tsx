"use client";

import { usePathname } from "next/navigation";
import { Plus, Sun, Moon, Menu } from "lucide-react";
import Link from "next/link";
import { MarketClockCompact } from "@/components/market-clock/market-clock-compact";
import { useTheme } from "@/components/theme-provider";
import { CommandPalette } from "@/components/command-palette";
import { UserMenu } from "@/components/user-menu";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":  "Dashboard",
  "/daily-prep": "Daily Prep",
  "/journal":    "Journal",
  "/trade-log":  "Trade Log",
  "/calendar":   "Calendar",
  "/levels":     "Levels",
  "/setups":     "Setups",
  "/knowledge":  "Knowledge Base",
  "/katmanlar":  "Education",
  "/analytics":  "Analytics",
  "/accounts":   "Accounts",
  "/weekly-review": "Weekly Review",
  "/mentorship": "Mentorship",
  "/settings":   "Settings",
};

const QUICK_ADD: Record<string, { label: string; href: string }> = {
  "/daily-prep": { label: "New Prep",   href: "/daily-prep/new" },
  "/journal":    { label: "Add Trade",  href: "/journal/new" },
  "/levels":     { label: "Add Level",  href: "/levels/new" },
};

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const title    = Object.entries(PAGE_TITLES).find(([key]) => pathname === key || pathname.startsWith(key + "/"))?.[1] ?? "";
  const quickAdd = Object.entries(QUICK_ADD).find(([key]) => pathname === key || pathname.startsWith(key + "/"))?.[1];

  return (
    <header className="flex items-center justify-between px-4 md:px-6 border-b border-app bg-elevated shrink-0" style={{ height: 56 }}>
      <div className="flex items-center gap-2">
        <button onClick={onMenuClick} className="md:hidden p-1.5 rounded-lg text-muted hover-surface transition-colors">
          <Menu size={16} />
        </button>
        <h1 className="text-sm font-semibold text-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <CommandPalette />
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
          title={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
          className="p-1.5 rounded-lg text-muted hover-surface transition-colors"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
