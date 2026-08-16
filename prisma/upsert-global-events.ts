/**
 * Seed script'lerinin ortak yazma yolu: ekonomik etkinlikleri GLOBAL satır
 * olarak (userId = null) yazar, böylece tüm hesaplarda görünürler.
 *
 * Eşleştirme (dateTime, currency, eventName) üçlüsüyle yapılır — `id` ile değil.
 * Bunun sebebi: satırlar cuid id taşıyor ve id'ye göre upsert etmek seed'i
 * tekrar çalıştırınca mükerrer kayıt üretiyordu.
 */
import type { PrismaClient } from "@prisma/client";

export type SeedEvent = {
  dateTime: Date;
  currency: string;
  eventName: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  userRiskTag?: "IGNORE" | "WATCH" | "HIGH_RISK" | "NO_TRADE_WINDOW" | "DATA_HIGH_LOW_RELEVANT" | null;
  noTradeBeforeMinutes?: number;
  noTradeAfterMinutes?: number;
  notes?: string;
};

export async function upsertGlobalEvents(
  prisma: PrismaClient,
  events: SeedEvent[],
): Promise<void> {
  console.log(`🌱 ${events.length} global etkinlik yazılıyor…\n`);

  let created = 0;
  let updated = 0;

  for (const ev of events) {
    const existing = await prisma.economicEvent.findFirst({
      where: {
        userId: null,
        dateTime: ev.dateTime,
        currency: ev.currency,
        eventName: ev.eventName,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.economicEvent.update({
        where: { id: existing.id },
        data: {
          impact: ev.impact,
          userRiskTag: ev.userRiskTag ?? null,
          noTradeBeforeMinutes: ev.noTradeBeforeMinutes ?? null,
          noTradeAfterMinutes: ev.noTradeAfterMinutes ?? null,
          notes: ev.notes ?? null,
        },
      });
      updated++;
    } else {
      // Alanlar tek tek yazılıyor: seed dizileri `key`/`id` gibi fazladan
      // alanlar taşıyor ve düz spread onları Prisma'ya sızdırırdı.
      await prisma.economicEvent.create({
        data: {
          userId: null,
          source: "MANUAL",
          dateTime: ev.dateTime,
          currency: ev.currency,
          eventName: ev.eventName,
          impact: ev.impact,
          userRiskTag: ev.userRiskTag ?? null,
          noTradeBeforeMinutes: ev.noTradeBeforeMinutes ?? null,
          noTradeAfterMinutes: ev.noTradeAfterMinutes ?? null,
          notes: ev.notes ?? null,
        },
      });
      created++;
    }

    console.log(`  ✅ ${ev.dateTime.toISOString().slice(0, 16).replace("T", " ")}Z  ${ev.currency}  ${ev.eventName}`);
  }

  console.log(`\n✨ Bitti. Yeni: ${created}, güncellenen: ${updated}`);
}
