import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { economicEventScope } from "@/lib/economic-events";
import { addDays, subDays } from "date-fns";
import { CalendarClient } from "./calendar-client";
import { InvestingCalendarWidget } from "@/components/investing-calendar-widget";
import { MonthlyQuarterGrid } from "./monthly-quarter-grid";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ qYear?: string; qMonth?: string }>;
}) {
  const sp = await searchParams;
  const userId = await requireUserId();

  const now = new Date();
  const qYear = parseInt(sp.qYear ?? String(now.getFullYear()), 10);
  const qMonth = parseInt(sp.qMonth ?? String(now.getMonth() + 1), 10);

  // Two different ranges on purpose: the list below shows what's coming up,
  // while the quarter grid shows whichever month the user navigated to.
  // Deriving the grid from the rolling window meant other months rendered
  // with no event markers at all.
  const [dbUser, events, monthEvents] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.economicEvent.findMany({
      where: {
        ...economicEventScope(userId),
        dateTime: { gte: subDays(now, 7), lte: addDays(now, 30) },
      },
      orderBy: { dateTime: "asc" },
    }),
    prisma.economicEvent.findMany({
      where: {
        ...economicEventScope(userId),
        dateTime: {
          gte: new Date(qYear, qMonth - 1, 1),
          lt: new Date(qYear, qMonth, 1),
        },
      },
      select: { dateTime: true, impact: true },
    }),
  ]);

  const eventsByDate: Record<string, { impact: string }[]> = {};
  for (const ev of monthEvents) {
    const d = new Date(ev.dateTime);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    (eventsByDate[key] ??= []).push({ impact: ev.impact });
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      {/* investing.com Economic Calendar */}
      <div>
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          Ekonomik Takvim
        </h2>
        <InvestingCalendarWidget />
      </div>

      {/* Aylık Quarter (Q1-Q4) görünümü */}
      <div>
        <MonthlyQuarterGrid year={qYear} month={qMonth} eventsByDate={eventsByDate} />
      </div>

      {/* Manuel olay listesi */}
      <div>
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          Events
        </h2>
        <CalendarClient events={events} isAdmin={dbUser?.role === "ADMIN"} />
      </div>
    </div>
  );
}
