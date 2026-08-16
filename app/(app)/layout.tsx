"use client";

import { useState } from "react";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { ClockTzProvider } from "@/components/market-clock/clock-tz-context";
import { NotificationScheduler } from "@/components/notification-scheduler";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ClockTzProvider>
      <NotificationScheduler />
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-bg-base)" }}>
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <AppSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopBar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Suspense>{children}</Suspense>
          </main>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </ClockTzProvider>
  );
}
