/**
 * Risk Guard — gün içi durma kuralı.
 *
 * Bu modülün varlık sebebi ölçülmüş bir şey: 146 pozisyonluk gerçek işlem
 * verisinde kazanma oranı %65 ama payoff oranı 0.42, yani işlem başına
 * beklenen değer negatif. Zarar kötü setup'lardan değil, kötü anlardan
 * geliyordu — $50 üstü bir kayıptan sonraki işlemin ortalaması −39.11,
 * genel ortalama −2.95 iken.
 *
 * Uygulama o güne kadar işleme girmeden önceki disiplini ölçüyordu
 * (Daily Prep), girdikten sonrakini hiç. Burası o boşluk.
 */

import { tradingDayKey } from "@/lib/time/trading-day";

export type GuardTrade = {
  entryTime: Date;
  exitTime: Date;
  netPnl: number | null;
};

export type GuardLimits = {
  /** Günlük zarar limiti, USD, pozitif sayı. 0 = kural kapalı. */
  dailyLossLimitUsd: number;
  /** Üst üste kaç kayıptan sonra durulacağı. 0 = kural kapalı. */
  maxConsecutiveLosses: number;
};

export type GuardBreach = "DAILY_LOSS" | "CONSECUTIVE_LOSSES";

export type GuardState = {
  /** Bugün kapanan pozisyonların net toplamı. */
  todayPnl: number;
  /** Bugün kapanan pozisyon sayısı. */
  todayCount: number;
  /** Günün sonundan geriye doğru kesintisiz kayıp serisi. */
  consecutiveLosses: number;
  /** Limite kalan mesafe (USD). Kural kapalıysa null. */
  remainingUsd: number | null;
  /** Günlük limitin ne kadarı kullanıldı (0–1). Kural kapalıysa null. */
  usedRatio: number | null;
  /** Aşılan kurallar. Boşsa gün devam ediyor. */
  breaches: GuardBreach[];
  /** Herhangi bir kural aşıldı mı. */
  shouldStop: boolean;
  /** Hiçbir kural tanımlı değil mi (kullanıcı henüz limit koymamış). */
  disabled: boolean;
};

/**
 * Bir pozisyonun hangi güne ait sayılacağı: kapanış anı, **piyasa günü** (ET).
 *
 * Önceden sunucunun yerel günü kullanılıyordu. Sunucu UTC'de, kullanıcı
 * UTC+3'te, piyasa ET'de olduğu için gece yarısına yakın kapanan bir zarar
 * ertesi güne yazılıp günlük limitten kaçabiliyordu. Kural artık
 * lib/time/trading-day.ts'te tek yerde tanımlı ve DST'yi de kapsıyor.
 */
const dayKey = tradingDayKey;

/**
 * Belirli bir gün için guard durumunu hesaplar.
 *
 * Pozisyon **kapanış** anına göre güne yazılıyor: bir gün önce açılıp bugün
 * kapanan işlemin zararı bugünün riskidir, çünkü bugün alınacak kararı
 * etkileyen odur.
 */
export function computeGuardState(
  trades: GuardTrade[],
  limits: GuardLimits,
  now: Date = new Date()
): GuardState {
  const today = dayKey(now);

  const todays = trades
    .filter((t) => dayKey(t.exitTime) === today)
    .sort((a, b) => a.exitTime.getTime() - b.exitTime.getTime());

  const todayPnl = todays.reduce((s, t) => s + (t.netPnl ?? 0), 0);

  // Seri günün sonundan geriye sayılır; ilk kayıp olmayan işlemde durur.
  let consecutiveLosses = 0;
  for (let i = todays.length - 1; i >= 0; i--) {
    if ((todays[i].netPnl ?? 0) < 0) consecutiveLosses++;
    else break;
  }

  const lossLimit = limits.dailyLossLimitUsd > 0 ? limits.dailyLossLimitUsd : null;
  const streakLimit = limits.maxConsecutiveLosses > 0 ? limits.maxConsecutiveLosses : null;

  const breaches: GuardBreach[] = [];
  if (lossLimit !== null && todayPnl <= -lossLimit) breaches.push("DAILY_LOSS");
  if (streakLimit !== null && consecutiveLosses >= streakLimit) breaches.push("CONSECUTIVE_LOSSES");

  // Kârdayken "kalan mesafe" limitin tamamıdır; zarar limiti kâra göre değil
  // sıfıra göre ölçülür, yoksa iyi bir sabah kötü bir öğleden sonrayı finanse eder.
  const lossSoFar = Math.max(0, -todayPnl);

  return {
    todayPnl,
    todayCount: todays.length,
    consecutiveLosses,
    remainingUsd: lossLimit === null ? null : Math.max(0, lossLimit - lossSoFar),
    usedRatio: lossLimit === null ? null : Math.min(1, lossSoFar / lossLimit),
    breaches,
    shouldStop: breaches.length > 0,
    disabled: lossLimit === null && streakLimit === null,
  };
}
