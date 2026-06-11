"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  BookOpen,
  BarChart3,
  Settings,
  Layers,
  TrendingUp,
  GraduationCap,
  Wallet,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard },
  { href: "/daily-prep",    label: "Daily Prep",    icon: ClipboardList },
  { href: "/journal",       label: "Journal",       icon: BookOpen },
  { href: "/calendar",      label: "Calendar",      icon: Calendar },
  { href: "/levels",        label: "Levels",        icon: Layers },
  { href: "/setups",        label: "Setups",        icon: TrendingUp },
  { href: "/knowledge",     label: "Knowledge",     icon: GraduationCap },
  { href: "/analytics",     label: "Analytics",     icon: BarChart3 },
  { href: "/accounts",      label: "Accounts",      icon: Wallet },
  { href: "/settings",      label: "Settings",      icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className="flex flex-col w-56 shrink-0 h-full border-r"
      style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b" style={{ borderColor: "var(--color-bg-border)" }}>
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          QT
        </div>
        <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
          QT Workspace
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                background: active ? "var(--color-bg-hover)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "var(--color-bg-surface)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon
                size={15}
                style={{ color: active ? "var(--color-accent)" : "var(--color-text-muted)" }}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer / logout */}
      <div className="p-2 border-t" style={{ borderColor: "var(--color-bg-border)" }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-danger)";
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-text-muted)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
