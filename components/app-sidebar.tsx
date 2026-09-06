"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useIsHydrated, useMediaQuery, useStoredValue, writeStoredValue } from "@/lib/use-stored-value";
import { Settings, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getNavGroups } from "@/lib/nav";
import { clearAllPrepDrafts } from "@/lib/use-prep-draft";
import { clearAppCaches } from "@/lib/offline-cache";

const NAV_GROUPS = getNavGroups();

export function AppSidebar({ mobileOpen = false, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();
  // Derived rather than set from an effect: on narrow screens the sidebar is
  // always collapsed, otherwise the stored preference wins.
  const mounted = useIsHydrated();
  const isNarrow = useMediaQuery("(max-width: 767px)");
  const storedCollapsed = useStoredValue("sidebar-collapsed", "false");
  const collapsed = isNarrow || storedCollapsed === "true";

  function toggle() {
    writeStoredValue("sidebar-collapsed", String(!collapsed));
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Oturum kapaninca kullaniciya ait yerel iz de kalmamali: localStorage ve
    // service worker cache'i oturumdan bagimsiz yasar. Ortak bir cihazda bir
    // sonraki kisi bunlari gorebiliyordu.
    clearAllPrepDrafts();
    await clearAppCaches();
    router.push("/login");
  }

  const w = mounted ? (collapsed ? 56 : 224) : 224;

  return (
    <aside
      className={`flex flex-col shrink-0 h-full border-r transition-all duration-200
        fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      style={{
        width: w,
        minWidth: w,
        background: "var(--color-bg-elevated)",
        borderColor: "var(--color-bg-border)",
        overflow: "hidden",
      }}
      onClick={(e) => e.stopPropagation()}
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
        />
        {!collapsed && (
          <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
            QT Workspace
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: "8px 8px" }}>
        {NAV_GROUPS.map(({ label: groupLabel, items }, groupIdx) => (
          <div key={groupLabel}>
            {collapsed ? (
              groupIdx > 0 && (
                <div className="my-2 mx-1 border-t" style={{ borderColor: "var(--color-bg-border)" }} />
              )
            ) : (
              <p
                className="px-3 mb-1"
                style={{
                  marginTop: groupIdx > 0 ? 12 : 4,
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--color-text-muted)",
                  fontWeight: 500,
                }}
              >
                {groupLabel}
              </p>
            )}
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  // Navigating on mobile should also dismiss the drawer;
                  // previously only tapping the backdrop closed it.
                  onClick={onClose}
                  title={collapsed ? label : undefined}
                  className="flex items-center rounded-lg text-sm font-medium transition-colors"
                  style={{
                    gap: collapsed ? 0 : 12,
                    padding: collapsed ? "8px 0" : "8px 12px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                    background: active ? "var(--color-bg-hover)" : "transparent",
                    marginBottom: 2,
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
          </div>
        ))}
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
          {!collapsed && <span className="text-sm">Hide</span>}
        </button>

        {/* Settings */}
        <Link
          href="/settings"
          onClick={onClose}
          title={collapsed ? "Settings" : undefined}
          className="w-full flex items-center rounded-lg text-sm transition-colors mb-1"
          style={{
            gap: collapsed ? 0 : 12,
            padding: collapsed ? "8px 0" : "8px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            color: pathname === "/settings" ? "var(--color-text-primary)" : "var(--color-text-muted)",
            background: pathname === "/settings" ? "var(--color-bg-hover)" : "transparent",
          }}
          onMouseEnter={(e) => {
            if (pathname !== "/settings") e.currentTarget.style.background = "var(--color-bg-surface)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = pathname === "/settings" ? "var(--color-bg-hover)" : "transparent";
          }}
        >
          <Settings size={16} style={{ color: pathname === "/settings" ? "var(--color-accent)" : "var(--color-text-muted)", flexShrink: 0 }} />
          {!collapsed && "Settings"}
        </Link>

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
