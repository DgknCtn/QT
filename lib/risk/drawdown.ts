/**
 * Kümülatif R eğrisinden maksimum düşüş.
 *
 * Analytics sayfasının içinde yaşıyordu ve test edilemiyordu; oradaki hata da
 * bu yüzden fark edilmemişti: tepe `-Infinity` ile başlatıldığı için eğrinin
 * çıkış noktası olan 0R düşüşe dahil edilmiyordu. [-1R, -2R] serisi 1R
 * drawdown veriyordu, doğrusu 2R.
 */
export function maxDrawdownR(chronoRCurve: { cumR: number }[]): number {
  // Eğri tanım gereği 0'dan başlar — ilk işlem zararlıysa düşüş o sıfırdan sayılır.
  let peak = 0;
  let dd = 0;
  for (const p of chronoRCurve) {
    if (p.cumR > peak) peak = p.cumR;
    const cur = peak - p.cumR;
    if (cur > dd) dd = cur;
  }
  return dd;
}
