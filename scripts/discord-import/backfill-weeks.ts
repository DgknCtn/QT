import { prisma } from "../../lib/prisma";

/** Monday of the ISO week containing `date` (UTC-based, matches MarketDay.date being UTC midnight). */
function isoWeekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Sunday (0) -> 7
  if (day !== 1) d.setUTCDate(d.getUTCDate() - (day - 1));
  return d;
}

/**
 * Groups any MarketDay rows not yet linked to a MarketWeek into their
 * containing (Mon-Fri) trading week. Safe to re-run -- idempotent via
 * upsert on MarketWeek.weekStart.
 */
export async function backfillWeeks(): Promise<{ weeksTouched: number; daysLinked: number }> {
  const days = await prisma.marketDay.findMany({ where: { marketWeekId: null } });
  const weekIds = new Set<string>();
  let daysLinked = 0;

  for (const day of days) {
    const weekStart = isoWeekStart(day.date);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 4);

    const week = await prisma.marketWeek.upsert({
      where: { weekStart },
      create: { weekStart, weekEnd },
      update: {},
    });
    weekIds.add(week.id);

    await prisma.marketDay.update({ where: { id: day.id }, data: { marketWeekId: week.id } });
    daysLinked++;
  }

  return { weeksTouched: weekIds.size, daysLinked };
}
