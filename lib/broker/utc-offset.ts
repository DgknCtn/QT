/**
 * Saat dilimi tahmini — bilerek parser'dan ayrı bir dosyada.
 *
 * Import ekranı (client bileşeni) bu fonksiyona ihtiyaç duyuyor. Parser'ın
 * içinde kalsaydı papaparse ve tüm ayrıştırma kodu tarayıcı paketine girerdi;
 * oysa ayrıştırma sunucuda çalışıyor.
 */

/**
 * Binance dosya adına export saat dilimini yazar:
 * "Binance-Futures-Trade-History-202608302008(UTC+3)-part1-of1.csv" -> 3
 * Bulamazsa null döner; çağıran kullanıcıya sormalı.
 */
export function guessUtcOffsetFromFilename(filename: string): number | null {
  const m = filename.match(/\(UTC([+-]\d{1,2})(?::(\d{2}))?\)/i);
  if (!m) return null;
  const hours = parseInt(m[1], 10);
  if (Number.isNaN(hours) || Math.abs(hours) > 14) return null;
  return hours;
}
