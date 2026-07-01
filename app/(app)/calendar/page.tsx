import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  const events = dbUser
    ? await prisma.economicEvent.findMany({
        where: {
          userId: user.id,
          dateTime: { gte: subDays(new Date(), 7), lte: addDays(new Date(), 30) },
        },
        orderBy: { dateTime: "asc" },
      }).catch(() => [])
    : [];

  const now = new Date();
  const qYear = parseInt(sp.qYear ?? String(now.getFullYear()), 10);
  const qMonth = parseInt(sp.qMonth ?? String(now.getMonth() + 1), 10);

  const eventsByDate: Record<string, { impact: string }[]> = {};
  for (const ev of events) {
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
        <CalendarClient userId={user.id} events={events as any} />
      </div>
    </div>
  );
}
