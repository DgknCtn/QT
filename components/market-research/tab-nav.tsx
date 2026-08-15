"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radar, CalendarDays, Search, Upload } from "lucide-react";

const TABS = [
  { href: "/market-research/today", label: "Today", icon: Radar },
  { href: "/market-research/days", label: "Market Days", icon: CalendarDays },
  { href: "/market-research/search", label: "Search", icon: Search },
] as const;

const ADMIN_TAB = { href: "/market-research/admin/import", label: "Import", icon: Upload };

export function TabNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const tabs = isAdmin ? [...TABS, ADMIN_TAB] : TABS;

  return (
    <nav
      className="flex items-center gap-1 overflow-x-auto"
      style={{ borderBottom: "1px solid var(--color-bg-border)" }}
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium shrink-0 whitespace-nowrap transition-colors"
            style={{
              color: active ? "var(--color-text-primary)" : "var(--color-text-muted)",
              borderBottom: active ? "2px solid var(--color-accent)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            <Icon size={14} style={{ color: active ? "var(--color-accent)" : "var(--color-text-muted)" }} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
