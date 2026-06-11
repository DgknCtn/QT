"use client";

import { usePathname } from "next/navigation";
import { Bell, Plus } from "lucide-react";
import Link from "next/link";
import { MarketClockCompact } from "@/components/market-clock/market-clock-compact";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":  "Dashboard",
  "/daily-prep": "Daily Prep",
  "/journal":    "Journal",
  "/calendar":   "Calendar",
  "/levels":     "Levels",
  "/setups":     "Setups",
  "/knowledge":  "Knowledge Base",
  "/analytics":  "Analytics",
  "/settings":   "Settings",
};

const QUICK_ADD: Record<string, { label: string; href: string }> = {
  "/daily-prep": { label: "New Prep",   href: "/daily-prep/new" },
  "/journal":    { label: "Add Trade",  href: "/journal/new" },
  "/levels":     { label: "Add Level",  href: "/levels/new" },
};

export function TopBar() {
  const pathname = usePathname();
  const title = Object.entries(PAGE_TITLES).find(([key]) => pathname === key || pathname.startsWith(key + "/"))?.[1] ?? "";
  const quickAdd = Object.entries(QUICK_ADD).find(([key]) => pathname === key || pathname.startsWith(key + "/"))?.[1];

  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b shrink-0"
      style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
    >
      <h1 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
        {title}
      </h1>

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
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Bell size={15} />
        </button>
      </div>
    </header>
  );
}
