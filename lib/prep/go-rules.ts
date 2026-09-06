/**
 * GO/NO-GO karar kuralları — tek kaynak.
 *
 * Bu kurallar yalnızca istemci bileşeninde yaşıyordu ve kaydetme action'ı
 * gönderilen `goNoGoStatus`'u olduğu gibi kabul ediyordu. İki sonucu vardı:
 *
 * 1. Normal kullanımda: kullanıcı GO seçtikten sonra geri dönüp stop'u veya
 *    narrative'i silerse, GO seçimi state'te kalıyordu. Kaydet butonu yalnızca
 *    kararın *dolu* olup olmadığına baktığı için geçersiz bir GO kaydediliyordu.
 * 2. Kötü niyetli kullanımda: `"use server"` action'ı doğrudan çağrılabilir.
 *
 * Kurallar burada; hem `step10-gonogo.tsx` hem kaydetme action'ı aynı
 * fonksiyonu çalıştırır. İstemci butonu kilitler, sunucu kaydı reddeder.
 */

import type { PrepFormData } from "@/app/(app)/daily-prep/new/types";

/** Kaydetmeye izin verilen kararlar. */
export const PREP_DECISIONS = ["GO", "WAIT", "NO_GO", "REVIEW_LATER", "MISSED_SETUP"] as const;
export type PrepDecision = (typeof PREP_DECISIONS)[number];

export function isPrepDecision(v: unknown): v is PrepDecision {
  return typeof v === "string" && (PREP_DECISIONS as readonly string[]).includes(v);
}

/** Fiyat premium/discount bağlamı HTF fikriyle çelişiyor mu. */
function premiumDiscountConflict(data: PrepFormData): string | null {
  const entries = Object.values(data.trueOpens ?? {}).filter(
    (t) => t.price && t.price.trim() !== "" && (t.position === "ABOVE" || t.position === "BELOW")
  );
  if (entries.length === 0) return null;
  const allAbove = entries.every((t) => t.position === "ABOVE"); // fiyat tüm TO'ların üstünde → premium
  const allBelow = entries.every((t) => t.position === "BELOW"); // fiyat tüm TO'ların altında → discount
  if (data.htfBias === "LONG" && allAbove)
    return "Long fikri premium bağlamla çelişiyor (fiyat tüm True Open'ların üstünde). Açıkla ya da NO-GO.";
  if (data.htfBias === "SHORT" && allBelow)
    return "Short fikri discount bağlamla çelişiyor (fiyat tüm True Open'ların altında). Açıkla ya da NO-GO.";
  return null;
}

/** No-trade penceresinin haber saatinin önü ve arkasındaki yarıçapı, dakika. */
export const NO_TRADE_WINDOW_MIN = 30;

/** "14:30" → gün başından itibaren dakika. Biçim tutmuyorsa null. */
function minutesOfDay(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/**
 * Haber no-trade penceresi — gerçek bir zaman penceresi olarak.
 *
 * Eskiden yalnızca haberin **etiketi** engel üretiyordu: gün içinde bir
 * NO_TRADE_WINDOW haberi varsa, girişin o habere saatlerce uzak olması bile
 * fark etmiyordu. Kural "haberin etrafında işlem yapma"ydı, "o haberin olduğu
 * gün hiç işlem yapma" değil.
 *
 * Planlanan giriş saati girilmemişse engel korunur: pencere içinde olmadığını
 * bilmiyorsak, güvenli varsayım işlem yapmamaktır — ama sebep açıkça söylenir
 * ki kullanıcı saati girerek engeli kaldırabilsin.
 */
function noTradeWindowBlock(data: PrepFormData): string | null {
  const willEnter = data.entry.entryModel && data.entry.entryModel !== "NO_ENTRY";
  if (!willEnter) return null;

  const blockers = (data.newsEvents ?? []).filter((e) => e.riskTag === "NO_TRADE_WINDOW");
  if (blockers.length === 0) return null;

  const entryMin = minutesOfDay(data.entry.plannedEntryTime ?? "");
  if (entryMin === null) {
    return `No-trade penceresi olan haber var (${blockers[0].eventName}). Planlanan giriş saatini gir ki mesafe hesaplanabilsin.`;
  }

  for (const ev of blockers) {
    const evMin = minutesOfDay(ev.time ?? "");
    // Saatsiz haberde mesafe olculemez; gun boyu engel gibi davranir.
    if (evMin === null) {
      return `${ev.eventName} için saat bilinmiyor, pencere hesaplanamıyor. Bu hard NO-GO.`;
    }
    const gap = Math.abs(entryMin - evMin);
    if (gap <= NO_TRADE_WINDOW_MIN) {
      return `Giriş, ${ev.eventName} haberine ${gap} dk mesafede (pencere ±${NO_TRADE_WINDOW_MIN} dk). Bu hard NO-GO.`;
    }
  }
  return null;
}

/** GO'yu imkânsız kılan koşullar. Boş dizi = GO seçilebilir. */
export function checkHardBlocks(data: PrepFormData): string[] {
  const blocks: string[] = [];
  if (!data.htfBias || !data.htfBiasExplanation) blocks.push("HTF narrative incomplete");
  if (!data.entry.stopPrice && data.entry.entryModel && data.entry.entryModel !== "NO_ENTRY")
    blocks.push("No stop defined");
  if (!data.entry.riskPercent && data.entry.entryModel && data.entry.entryModel !== "NO_ENTRY")
    blocks.push("No risk % defined");
  if (data.ssmt.formed === "NO" && data.htfBias !== "WAIT" && data.htfBias !== "NEUTRAL")
    blocks.push("No SSMT / crack on directional idea (reversal risk)");
  const pd = premiumDiscountConflict(data);
  if (pd) blocks.push(pd);
  const ntw = noTradeWindowBlock(data);
  if (ntw) blocks.push(ntw);
  return blocks;
}

/** GO'yu engellemeyen, ama kullanıcıya gösterilmesi gereken eksikler. */
export function checkSoftWarnings(data: PrepFormData): string[] {
  const warnings: string[] = [];
  if (!data.confirmation.confirmationType) warnings.push("No confirmation type selected");
  if (data.dfr.dfrType && !data.dfr.dfrHigh) warnings.push("DFR type set but no levels entered");
  if (!data.active90mCycle) warnings.push("90m quarter not selected");
  if (data.ssmt.formed === "YES") {
    const behaviors = [data.ssmt.assetABehavior, data.ssmt.assetBBehavior, data.ssmt.assetCBehavior];
    if (behaviors.some((b) => !b || b.trim() === "")) {
      warnings.push("Triad korelasyonu eksik (üç asset davranışı işaretlenmemiş)");
    }
  }
  const highRisk = (data.newsEvents ?? []).find((e) => e.riskTag === "HIGH_RISK" || e.impact === "HIGH");
  if (highRisk) warnings.push(`Yüksek etkili haber var (${highRisk.eventName}) — zamanlamayı gözden geçir`);
  return warnings;
}

export type GoEvaluation = {
  hardBlocks: string[];
  softWarnings: string[];
  /** GO seçilebilir mi. */
  canGo: boolean;
  /** Bu prep verisiyle kaydedilmesine izin verilen kararlar. */
  allowedDecisions: PrepDecision[];
};

export function evaluateGoBlockers(data: PrepFormData): GoEvaluation {
  const hardBlocks = checkHardBlocks(data);
  const canGo = hardBlocks.length === 0;
  return {
    hardBlocks,
    softWarnings: checkSoftWarnings(data),
    canGo,
    allowedDecisions: canGo
      ? [...PREP_DECISIONS]
      : PREP_DECISIONS.filter((d) => d !== "GO"),
  };
}

/**
 * Sunucunun kaydetmeden hemen önce çalıştırdığı kapı.
 *
 * Ön koşulları bozulmuş bir GO sessizce NO-GO'ya çevrilmez — kullanıcının
 * kararını arkasından değiştirmek, ürünün güvenilirliğini bozar. Bunun yerine
 * kayıt reddedilir ve sebep söylenir.
 */
export function assertDecisionAllowed(data: PrepFormData, decision: string): void {
  if (!isPrepDecision(decision)) {
    throw new Error(`Geçersiz karar değeri: ${decision}`);
  }
  const { allowedDecisions, hardBlocks } = evaluateGoBlockers(data);
  if (!allowedDecisions.includes(decision)) {
    throw new Error(
      `GO kaydedilemez — ön koşullar sağlanmıyor: ${hardBlocks.join("; ")}`
    );
  }
}
