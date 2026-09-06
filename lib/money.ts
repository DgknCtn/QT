/**
 * Tek para biçimlendirme noktası.
 *
 * Var oluş sebebi somut bir hata: Analytics'te net P&L
 * `$${Math.abs(totalPnl)}` ile basılıyordu, yani −125 ekranda **$125**
 * görünüyordu. Renk (kırmızı/yeşil) işareti taşıyor sanılmıştı; renk asla
 * tek başına işaret taşıyamaz — renk körlüğü, ekran görüntüsü, kopyala-yapıştır
 * ve ekran okuyucu hepsinde kaybolur.
 *
 * Kural: negatif değer **her zaman** açık bir eksi işaretiyle gösterilir.
 * Renk yalnızca ikincil sinyaldir.
 */

/** U+2212 MINUS SIGN — hyphen'dan geniş, finansal gösterimde okunaklı. */
const MINUS = "−";

export type FormatUsdOptions = {
  /** Ondalık basamak. Varsayılan 2. */
  decimals?: number;
  /** Pozitif değerlerin başına "+" konsun mu. Varsayılan false. */
  signed?: boolean;
};

/**
 * USD tutarını biçimlendirir. Negatifte daima `−$125.00`.
 *
 * `null` / `undefined` / `NaN` → `"—"`. "Değer yok" ile "sıfır" farklı
 * şeylerdir; sıfırı 0 olarak, veriyi olmayanı tire olarak göstermek
 * kullanıcının yanlış güven hissetmesini engeller.
 */
export function formatUsd(n: number | null | undefined, opts: FormatUsdOptions = {}): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const { decimals = 2, signed = false } = opts;
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  // -0.4 gibi değerler decimals=0'da "$0" olur; sıfıra yuvarlanmış bir tutara
  // eksi koymak yanıltıcı olurdu, o yüzden yuvarlanmış değere bakıyoruz.
  const rounded = Number(Math.abs(n).toFixed(decimals));
  if (rounded === 0) return `$${abs}`;
  if (n < 0) return `${MINUS}$${abs}`;
  return signed ? `+$${abs}` : `$${abs}`;
}

/** Aynı kurallar, R cinsinden. `+1.2R` / `−0.5R`. */
export function formatR(n: number | null | undefined, decimals = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n).toFixed(decimals);
  const rounded = Number(abs);
  if (rounded === 0) return `${abs}R`;
  return `${n < 0 ? MINUS : "+"}${abs}R`;
}

export { MINUS as MINUS_SIGN };
