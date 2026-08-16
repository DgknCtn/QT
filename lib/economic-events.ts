import type { Prisma } from "@prisma/client";

/**
 * Ekonomik etkinlik sorguları için ortak scope.
 *
 * `economic_events.userId == null` global (seed'lenmiş, herkese görünür)
 * etkinliktir; dolu olan userId ise kullanıcının kendi eklediği özel kayıttır.
 * Sorgularda düz `where: { userId }` kullanmak global takvimi gizler — bu
 * yüzden her okuma bu helper'dan geçmeli.
 */
export function economicEventScope(userId: string): Prisma.EconomicEventWhereInput {
  return { OR: [{ userId }, { userId: null }] };
}

/**
 * Bir etkinliği düzenleme/silme yetkisi.
 * Kişisel kayıtları sahibi, global kayıtları yalnızca ADMIN yönetebilir.
 */
export function canManageEvent(
  event: { userId: string | null },
  user: { id: string; role: string },
): boolean {
  return event.userId === null ? user.role === "ADMIN" : event.userId === user.id;
}
