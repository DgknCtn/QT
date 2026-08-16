import type { PrepFormData } from "@/app/(app)/daily-prep/new/types";

/**
 * "Son prep'ten kopyala" — hangi alanların yeni prep'e taşınacağı.
 *
 * Beyaz liste (kara liste değil) bilinçli: `PrepFormData`'ya ileride eklenecek
 * bir alan varsayılan olarak TAŞINMAZ. Bir trade günlüğünde güvenli yön budur —
 * yanlışlıkla taşınan eski bir fiyat, eksik gelen bir alandan çok daha pahalı.
 *
 * Taşınanlar yavaş değişen bağlam: enstrüman/triad/seans ve HTF anlatısı.
 * Taşınmayanlar güne özgü olan her şey: haberler, cycle (saat dolduruyor),
 * True Open fiyatları, DFR, SSMT, konfirmasyon, giriş planı ve GO/NO-GO kararı.
 */
export const CARRY_OVER_FIELDS = [
  "session",
  "marketGroup",
  "triad",
  "primaryInstrument",
  "secondaryInstruments",
  "htfBias",
  "htfBiasConfidence",
  "htfInvalidation",
  "htfBiasExplanation",
  "weeklyPo3State",
  "dailyPo3State",
  "mmxmStage",
  "mainLiquidityTarget",
  "customLiqTarget",
] as const;

export type CarryOverField = (typeof CARRY_OVER_FIELDS)[number];
export type PrepCarryOver = Pick<PrepFormData, CarryOverField>;

/** Kullanıcıya "kopyalandı" rozetiyle gösterilecek alanlar. */
export function carriedFieldKeys(carry: Partial<PrepCarryOver>): string[] {
  return CARRY_OVER_FIELDS.filter((key) => {
    const value = carry[key];
    if (Array.isArray(value)) return value.length > 0;
    return value != null && value !== "";
  });
}

/**
 * Taşınacak alanları forma uygular. Yalnızca dolu gelen alanlar yazılır, böylece
 * eksik bir geçmiş kayıt formdaki mevcut değeri silmez.
 */
export function applyCarryOver(
  base: PrepFormData,
  carry: Partial<PrepCarryOver>,
): PrepFormData {
  const next = { ...base };

  for (const key of CARRY_OVER_FIELDS) {
    const value = carry[key];
    if (value == null) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      next.secondaryInstruments = [...value];
      continue;
    }
    if (value === "") continue;
    // CARRY_OVER_FIELDS üyeleri (secondaryInstruments hariç) string alanlar.
    (next as unknown as Record<string, string>)[key] = value;
  }

  return next;
}
