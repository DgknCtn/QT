/**
 * Tek seferlik backfill — baseAsset alanı eklenmeden önce içe aktarılmış
 * BrokerTrade satırlarını doldurur.
 *
 * Idempotent: baseAsset'i zaten dolu olan satırlara dokunmaz, tekrar
 * çalıştırmak güvenlidir.
 *
 * Run: npx dotenv-cli -e .env -- npx tsx prisma/backfill-base-asset.ts
 */
import { PrismaClient } from "@prisma/client";
import { toBaseAsset } from "../lib/broker/symbols";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

async function main() {
  const pending = await prisma.brokerTrade.findMany({
    where: { baseAsset: null },
    select: { id: true, instrument: true },
  });

  if (pending.length === 0) {
    console.log("Doldurulacak satır yok.");
    return;
  }

  // Aynı enstrümana ait satırlar tek update ile geçilir: 100 satır için
  // 100 sorgu yerine sembol sayısı kadar sorgu.
  const byAsset = new Map<string, string[]>();
  for (const t of pending) {
    const asset = toBaseAsset(t.instrument);
    if (!asset) continue;
    if (!byAsset.has(asset)) byAsset.set(asset, []);
    byAsset.get(asset)!.push(t.id);
  }

  let updated = 0;
  for (const [asset, ids] of byAsset) {
    const res = await prisma.brokerTrade.updateMany({
      where: { id: { in: ids } },
      data: { baseAsset: asset },
    });
    updated += res.count;
  }

  console.log(`${updated} satır dolduruldu (${byAsset.size} farklı coin).`);
  console.log([...byAsset.keys()].sort().join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
