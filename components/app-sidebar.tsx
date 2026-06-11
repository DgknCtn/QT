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
  ClipboardCheck,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV_GROUPS = [
  {
    label: "Ana",
    items: [
      { href: "/dashboard",  label: "Dashboard",   icon: LayoutDashboard },
      { href: "/daily-prep", label: "Daily Prep",   icon: ClipboardList },
      { href: "/journal",    label: "Journal",      icon: BookOpen },
      { href: "/calendar",   label: "Calendar",     icon: Calendar },
    ],
  },
  {
    label: "Analiz",
    items: [
      { href: "/analytics",     label: "Analytics",       icon: BarChart3 },
      { href: "/accounts",      label: "Accounts",        icon: Wallet },
      { href: "/goals",         label: "Goals",           icon: Target },
      { href: "/playbook",      label: "Playbook",        icon: BookMarked },
      { href: "/weekly-review", label: "Haftalık Review", icon: ClipboardCheck },
    ],
  },
  {
    label: "Araçlar",
    items: [
      { href: "/risk-calculator", label: "Risk Calc",   icon: Calculator },
      { href: "/setups",          label: "Setups",      icon: TrendingUp },
      { href: "/knowledge",       label: "Knowledge",   icon: GraduationCap },
      { href: "/mentorship",      label: "Mentorship",  icon: GraduationCap },
      { href: "/settings",        label: "Settings",    icon: Settings },
    ],
  },
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

  const w = mounted ? (collapsed ? 56 : 220) : 220;

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
        className="flex items-center border-b shrink-0 relative overflow-hidden"
        style={{
          borderColor: "var(--color-bg-border)",
          height: 56,
          padding: collapsed ? "0 16px" : "0 16px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 10,
        }}
      >
        {/* subtle accent glow behind logo */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(79,142,247,0.07) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        <Image
          src="/qtlogo.png"
          alt="QT"
          width={26}
          height={26}
          className="rounded-md shrink-0"
          style={{ filter: "invert(1)", position: "relative" }}
        />
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight truncate" style={{ color: "var(--color-text-primary)", position: "relative" }}>
            QT Workspace
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: "10px 6px" }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? 4 : 0 }}>
            {/* Group label */}
            {!collapsed && (
              <p
                className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1"
                style={{ color: "var(--color-text-muted)", marginTop: gi === 0 ? 2 : 10 }}
              >
                {group.label}
              </p>
            )}
            {collapsed && gi > 0 && (
              <div style={{ height: 1, background: "var(--color-bg-border)", margin: "8px 4px" }} />
            )}

            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  title={collapsed ? label : undefined}
                  className="flex items-center rounded-lg text-[13px] font-medium transition-colors relative"
                  style={{
                    gap: collapsed ? 0 : 10,
                    padding: collapsed ? "7px 0" : "6px 10px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                    background: active ? "var(--color-bg-hover)" : "transparent",
                    marginBottom: 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "var(--color-bg-surface)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Active left accent bar */}
                  {active && !collapsed && (
                    <span style={{
                      position: "absolute",
                      left: 0, top: "20%", bottom: "20%",
                      width: 3,
                      borderRadius: 2,
                      background: "var(--color-accent)",
                    }} />
                  )}
                  <Icon
                    size={15}
                    style={{
                      color: active ? "var(--color-accent)" : "var(--color-text-muted)",
                      flexShrink: 0,
                    }}
                  />
                  {!collapsed && label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t" style={{ borderColor: "var(--color-bg-border)", padding: "6px" }}>
        <button
          onClick={toggle}
          title={collapsed ? "Genişlet" : "Daralt"}
          className="w-full flex items-center rounded-lg transition-colors mb-1"
          style={{
            gap: collapsed ? 0 : 10,
            padding: collapsed ? "7px 0" : "7px 10px",
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
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          {!collapsed && <span className="text-[13px]">Daralt</span>}
        </button>

        <button
          onClick={handleLogout}
          title={collapsed ? "Sign out" : undefined}
          className="w-full flex items-center rounded-lg text-[13px] transition-colors"
          style={{
            gap: collapsed ? 0 : 10,
            padding: collapsed ? "7px 0" : "7px 10px",
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
          <LogOut size={15} style={{ flexShrink: 0 }} />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}
