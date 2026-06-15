import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { ClockTzProvider } from "@/components/market-clock/clock-tz-context";
import { NotificationScheduler } from "@/components/notification-scheduler";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClockTzProvider>
      <NotificationScheduler />
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-bg-base)" }}>
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Suspense>{children}</Suspense>
          </main>
        </div>
      </div>
    </ClockTzProvider>
  );
}
