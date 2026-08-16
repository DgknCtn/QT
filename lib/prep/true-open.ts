/**
 * True Open'a göre premium/discount türetimi.
 *
 * Adım 5'te kullanıcı her True Open için ayrı ayrı "fiyat üstünde mi altında mı"
 * ve "premium mı discount mı" seçiyordu — altı satır × iki seçim. İkisi de tek
 * bir anlık fiyattan türetilebilir; bu dosya o kuralı tutar.
 *
 * Yön kuralı `steps/step10-gonogo.tsx` içindeki `premiumDiscountConflict()` ile
 * aynı: fiyat True Open'ın ÜSTÜNDEyse premium (short-favorable). Türetilen değer
 * `trueOpens[key].position` alanına YAZILIR — uçuşta hesaplanan bir değere
 * dönüştürülmez — böylece Adım 10 hiç değişmeden çalışmaya devam eder.
 */

export type TrueOpenPosition = "ABOVE" | "BELOW" | "AT";
export type TrueOpenInterpretation = "PREMIUM" | "DISCOUNT" | "NEUTRAL";

export type TrueOpenDerivation = {
  position: TrueOpenPosition;
  interpretation: TrueOpenInterpretation;
};

/**
 * Enstrümanın tick büyüklüğü. Bu kadarlık farkı "aynı seviye" (AT) sayarız;
 * aksi halde bir tick'lik gürültü premium/discount kararı ürettirir.
 *
 * Değerler `app/(app)/risk-calculator` içindeki enstrüman tablosuyla aynı
 * mantıkta: vadeli endeksler 0.25, YM 1, FX 4. hane, kripto 1.
 */
const TICK_BY_INSTRUMENT: Record<string, number> = {
  NQ: 0.25, MNQ: 0.25,
  ES: 0.25, MES: 0.25,
  YM: 1, MYM: 1,
  RTY: 0.1, M2K: 0.1,
  CL: 0.01, MCL: 0.01,
  GC: 0.1, MGC: 0.1,
  EURUSD: 0.0001, GBPUSD: 0.0001, USDJPY: 0.01, DXY: 0.001,
  BTC: 1, BTCUSD: 1, ETH: 0.1, ETHUSD: 0.1,
};

/** Bilinmeyen enstrüman → 0: sadece birebir eşitlik AT sayılır. */
export function toleranceFor(instrument: string | undefined | null): number {
  if (!instrument) return 0;
  return TICK_BY_INSTRUMENT[instrument.trim().toUpperCase()] ?? 0;
}

export function deriveTrueOpen(
  currentPrice: number,
  openPrice: number,
  tolerance = 0,
): TrueOpenDerivation {
  const diff = currentPrice - openPrice;

  if (Math.abs(diff) <= tolerance) {
    return { position: "AT", interpretation: "NEUTRAL" };
  }
  return diff > 0
    ? { position: "ABOVE", interpretation: "PREMIUM" }
    : { position: "BELOW", interpretation: "DISCOUNT" };
}

/**
 * Serbest metin fiyat alanını sayıya çevirir. Form alanları string tuttuğu için
 * boş/yarım girdi ("", "-", "12.") normal — bunlar `null` döner ve çağıran
 * satırı olduğu gibi bırakır.
 */
export function parsePrice(value: string | undefined | null): number | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
