import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { addDays, subDays } from "date-fns";
import { CalendarClient } from "./calendar-client";
import { InvestingCalendarWidget } from "@/components/investing-calendar-widget";

export default async function CalendarPage() {
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

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      {/* investing.com Economic Calendar */}
      <div>
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          Ekonomik Takvim
        </h2>
        <InvestingCalendarWidget />
      </div>

      {/* Manuel olay listesi */}
      <div>
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          Olaylarım
        </h2>
        <CalendarClient userId={user.id} events={events as any} />
      </div>
    </div>
  );
}
