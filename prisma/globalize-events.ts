/**
 * Kullanıcı başına kopyalanmış ekonomik etkinlikleri TEK bir global satıra indirger.
 *
 * `economic_events.userId` artık nullable: null = global (herkes görür).
 * Bu script, birden fazla kullanıcıda birebir aynı olan etkinlikleri (aynı
 * dateTime + currency + eventName) tek satıra toplar ve `userId`'yi null yapar.
 *
 * Sadece TEK bir kullanıcıda bulunan etkinlikler DOKUNULMADAN kalır — onlar
 * kullanıcının kendi eklediği özel kayıtlar olabilir.
 *
 * Tekrar çalıştırılabilir (idempotent).
 *
 * Çalıştır: npm run events:globalize
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

const keyOf = (e: { dateTime: Date; currency: string; eventName: string }) =>
  `${e.dateTime.toISOString()}|${e.currency}|${e.eventName}`;

async function main() {
  const all = await prisma.economicEvent.findMany({ orderBy: { createdAt: "asc" } });

  const byKey = new Map<string, typeof all>();
  for (const e of all) {
    const k = keyOf(e);
    byKey.set(k, [...(byKey.get(k) ?? []), e]);
  }

  let promoted = 0;
  let removed = 0;
  let untouched = 0;

  for (const [, rows] of byKey) {
    const global = rows.find((r) => r.userId === null);
    const owners = new Set(rows.filter((r) => r.userId !== null).map((r) => r.userId));

    // Zaten global: fazlalık kullanıcı kopyalarını temizle.
    if (global) {
      const dupes = rows.filter((r) => r.id !== global.id);
      if (dupes.length) {
        await prisma.economicEvent.deleteMany({ where: { id: { in: dupes.map((d) => d.id) } } });
        removed += dupes.length;
      }
      continue;
    }

    // Tek kullanıcıya ait, paylaşılmamış → kişisel kayıt, dokunma.
    if (owners.size < 2) {
      untouched += rows.length;
      continue;
    }

    // Birden fazla kullanıcıda aynı etkinlik → ilkini global yap, kalanı sil.
    const [keep, ...dupes] = rows;
    await prisma.economicEvent.update({ where: { id: keep.id }, data: { userId: null } });
    promoted++;
    if (dupes.length) {
      await prisma.economicEvent.deleteMany({ where: { id: { in: dupes.map((d) => d.id) } } });
      removed += dupes.length;
    }
  }

  const total = await prisma.economicEvent.count();
  const globals = await prisma.economicEvent.count({ where: { userId: null } });

  console.log(`🌍 global yapıldı : ${promoted}`);
  console.log(`🗑️  silinen kopya : ${removed}`);
  console.log(`👤 kişisel (korundu): ${untouched}`);
  console.log(`\n📊 toplam satır: ${total}  (global: ${globals}, kişisel: ${total - globals})`);
}

main()
  .catch((e) => { console.error("\n❌ Hata:", e.message ?? e); process.exit(1); })
  .finally(() => prisma.$disconnect());
