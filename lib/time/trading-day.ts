/**
 * Gün sınırları — tek kaynak.
 *
 * Zaman modeli parçalıydı: Market Clock New York saat dilimini açıkça
 * kullanıyordu (`getEtParts`), ama Risk Guard'ın günü ve takvim gün sınırları
 * **sunucunun yerel günü**ne bakıyordu. Sunucu UTC'de, kullanıcı UTC+3'te,
 * piyasa ET'de olduğu için aynı işlem üç farklı "gün"e düşebiliyordu:
 * gece yarısına yakın kapanan bir zarar ertesi güne yazılıp günlük limitten
 * kaçabiliyor, bir haber yanlış güne düşüyordu.
 *
 * Üç ayrı kavram var ve karıştırılmamalı:
 *
 *   takvim günü          — bir tarih değeri (prep'in tarihi gibi).
 *   kullanıcının günü    — kullanıcının kendi saatiyle gün; ne zaman "bugün"
 *                          dediğini belirler.
 *   trading session günü — piyasanın günü (ET). Risk limiti, seans ve çeyrek
 *                          hesapları buna göre yürür; DST'yi Intl hallediyor.
 *
 * Zaman her yerde UTC olarak saklanır; bu modül yalnızca *yorumlar*.
 */

/** Piyasanın referans saat dilimi. Quarterly Theory seansları ET tanımlıdır. */
export const MARKET_TIME_ZONE = "America/New_York";

/** Bir anın, verilen saat dilimindeki takvim parçaları. */
export function zonedParts(d: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? "0", 10);
  return { y: get("year"), mo: get("month"), d: get("day"), h: get("hour"), min: get("minute"), s: get("second") };
}

/**
 * Bir anın, verilen saat dilimindeki gün anahtarı: `"2026-08-20"`.
 *
 * Anahtar üzerinden karşılaştırma yapmak, yerel `Date` alanlarına (getDate vb.)
 * bakmaktan güvenli: sunucunun saat dilimi sonucu değiştirmez.
 */
export function dayKeyInZone(d: Date, timeZone: string): string {
  const p = zonedParts(d, timeZone);
  return `${p.y}-${String(p.mo).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** Piyasa (ET) gününün anahtarı. Risk limiti ve seans hesapları bunu kullanır. */
export function tradingDayKey(d: Date): string {
  return dayKeyInZone(d, MARKET_TIME_ZONE);
}

/** İki an aynı piyasa gününe mi düşüyor. */
export function isSameTradingDay(a: Date, b: Date): boolean {
  return tradingDayKey(a) === tradingDayKey(b);
}

/** `"2026-08-20"` gün anahtarının, o saat dilimindeki başlangıç anı (UTC Date). */
export function startOfZonedDay(dayKey: string, timeZone: string): Date {
  return zonedTimeToUtc(dayKey, 0, 0, 0, timeZone);
}

/** Aynı günün son anı (23:59:59.999). */
export function endOfZonedDay(dayKey: string, timeZone: string): Date {
  const d = zonedTimeToUtc(dayKey, 23, 59, 59, timeZone);
  return new Date(d.getTime() + 999);
}

/**
 * Verilen anın içinde bulunduğu piyasa gününün UTC sınırları.
 *
 * Sorgu aralıkları için: `date.setHours(0,0,0,0)` sunucunun saat dilimine
 * bağlıdır ve DST geçişlerinde kayar; bu fonksiyon ET gününü tam olarak
 * kapsayan mutlak anları verir.
 */
export function tradingDayRange(d: Date): { start: Date; end: Date } {
  const key = tradingDayKey(d);
  return { start: startOfZonedDay(key, MARKET_TIME_ZONE), end: endOfZonedDay(key, MARKET_TIME_ZONE) };
}

/**
 * Bir saat dilimindeki duvar saatini mutlak ana çevirir.
 *
 * Offset'i sabit varsaymıyoruz: DST'de aynı saat dilimi yılın yarısında -5,
 * yarısında -4. Tahmini bir andan offset'i ölçüp düzeltiyoruz; ikinci geçiş,
 * düzeltmenin kendisinin bir DST sınırını aşması ihtimalini kapatır.
 */
function zonedTimeToUtc(dayKey: string, h: number, m: number, s: number, timeZone: string): Date {
  const [y, mo, d] = dayKey.split("-").map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, m, s);
  let result = asUtc;
  for (let i = 0; i < 2; i++) {
    result = asUtc + offsetMs(new Date(result), timeZone);
  }
  return new Date(result);
}

/** `utcAnı - o saat dilimindeki duvar saati` farkı, milisaniye. */
function offsetMs(at: Date, timeZone: string): number {
  const p = zonedParts(at, timeZone);
  const wall = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.min, p.s);
  return at.getTime() - wall;
}
