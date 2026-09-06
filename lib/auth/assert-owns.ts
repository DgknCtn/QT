/**
 * İlişki kurulmadan önce bağlı nesnenin sahipliğini doğrular.
 *
 * Trade'in kendi `userId` filtresi doğruydu, ama `dailyPrepId` istemciden
 * geldiği gibi kaydediliyordu: kimliği doğrulanmış herhangi biri başkasının
 * prep id'sini geçerek kendi journal kaydını o prep'e bağlayabiliyordu.
 * Detay sorgusu ilişkili prep'in bazı alanlarını da seçtiği için bu, veri
 * sızıntısına açılan bir yol.
 *
 * OWASP'ın kuralı: her nesne erişiminde yetki ayrıca kontrol edilir; bir
 * yerdeki filtre başka bir yerdeki ilişkiyi korumaz.
 */

import { prisma } from "@/lib/prisma";

/** Sahiplik doğrulanamadığında atılır. */
export class NotOwnedError extends Error {
  constructor(kind: string) {
    // Mesaj "yok" ile "senin değil"i ayırmıyor: hangisi olduğunu söylemek,
    // başkasının kayıt id'lerini yoklamak için kullanılabilir bir sinyaldir.
    super(`İlişkilendirilecek ${kind} bulunamadı.`);
    this.name = "NotOwnedError";
  }
}

/**
 * `prepId` bu kullanıcıya aitse aynen döner, `null`/boş ise `null` döner,
 * başkasına aitse veya yoksa hata fırlatır.
 */
export async function assertOwnsDailyPrep(
  userId: string,
  prepId: string | null | undefined,
): Promise<string | null> {
  if (!prepId) return null;
  const found = await prisma.dailyPrep.findFirst({
    where: { id: prepId, userId },
    select: { id: true },
  });
  if (!found) throw new NotOwnedError("hazırlık kaydı");
  return found.id;
}

/** Aynı kural broker pozisyonları için — journal eşleştirmesinde kullanılacak. */
export async function assertOwnsBrokerTrade(
  userId: string,
  brokerTradeId: string | null | undefined,
): Promise<string | null> {
  if (!brokerTradeId) return null;
  const found = await prisma.brokerTrade.findFirst({
    where: { id: brokerTradeId, userId },
    select: { id: true },
  });
  if (!found) throw new NotOwnedError("broker pozisyonu");
  return found.id;
}

/** Aynı kural manuel journal kaydı için. */
export async function assertOwnsTrade(
  userId: string,
  tradeId: string | null | undefined,
): Promise<string | null> {
  if (!tradeId) return null;
  const found = await prisma.trade.findFirst({
    where: { id: tradeId, userId },
    select: { id: true },
  });
  if (!found) throw new NotOwnedError("journal kaydı");
  return found.id;
}
