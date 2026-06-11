"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  BookOpen,
  BarChart3,
  Settings,
  TrendingUp,
  GraduationCap,
  BookMarked,
  Wallet,
  Target,
  Calculator,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/daily-prep", label: "Daily Prep",  icon: ClipboardList },
  { href: "/journal",    label: "Journal",     icon: BookOpen },
  { href: "/calendar",   label: "Calendar",    icon: Calendar },
  { href: "/setups",     label: "Setups",      icon: TrendingUp },
  { href: "/knowledge",  label: "Knowledge",   icon: GraduationCap },
  { href: "/analytics",  label: "Analytics",   icon: BarChart3 },
  { href: "/accounts",   label: "Accounts",    icon: Wallet },
  { href: "/goals",            label: "Goals",      icon: Target },
  { href: "/playbook",        label: "Playbook",   icon: BookMarked },
  { href: "/risk-calculator", label: "Risk Calc",  icon: Calculator },
  { href: "/mentorship",      label: "Mentorship",  icon: GraduationCap },
  { href: "/settings",   label: "Settings",    icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted,   setMounted]   = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      localStorage.setItem("sidebar-collapsed", String(!c));
      return !c;
    });
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const w = mounted ? (collapsed ? 56 : 224) : 224;

  return (
    <aside
      className="flex flex-col shrink-0 h-full border-r transition-all duration-200"
      style={{
        width: w,
        minWidth: w,
        background: "var(--color-bg-elevated)",
        borderColor: "var(--color-bg-border)",
        overflow: "hidden",
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center border-b shrink-0"
        style={{
          borderColor: "var(--color-bg-border)",
          height: 56,
          padding: collapsed ? "0 12px" : "0 16px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 10,
        }}
      >
        <Image
          src="/qtlogo.png"
          alt="QT"
          width={28}
          height={28}
          className="rounded-md shrink-0"
          style={{ filter: "invert(1)" }}
        />
        {!collapsed && (
          <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
            QT Workspace
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5" style={{ padding: collapsed ? "12px 8px" : "12px 8px" }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className="flex items-center rounded-lg text-sm font-medium transition-colors"
              style={{
                gap: collapsed ? 0 : 12,
                padding: collapsed ? "8px 0" : "8px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                background: active ? "var(--color-bg-hover)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "var(--color-bg-surface)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = active ? "var(--color-bg-hover)" : "transparent";
              }}
            >
              <Icon
                size={16}
                style={{ color: active ? "var(--color-accent)" : "var(--color-text-muted)", flexShrink: 0 }}
              />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t" style={{ borderColor: "var(--color-bg-border)", padding: "8px" }}>
        {/* Collapse toggle */}
        <button
          onClick={toggle}
          title={collapsed ? "Genişlet" : "Daralt"}
          className="w-full flex items-center rounded-lg transition-colors mb-1"
          style={{
            gap: collapsed ? 0 : 12,
            padding: collapsed ? "8px 0" : "8px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            color: "var(--color-text-muted)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-bg-surface)";
            e.currentTarget.style.color = "var(--color-text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--color-text-muted)";
          }}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          {!collapsed && <span className="text-sm">Daralt</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? "Sign out" : undefined}
          className="w-full flex items-center rounded-lg text-sm transition-colors"
          style={{
            gap: collapsed ? 0 : 12,
            padding: collapsed ? "8px 0" : "8px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            color: "var(--color-text-muted)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-danger)";
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-text-muted)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}
