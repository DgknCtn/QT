/**
 * Borsadan bağımsız coin kimliği.
 *
 * Aynı coin her borsada farklı yazılıyor: OKX "PUMP-USDT-SWAP", Binance
 * "PUMPUSDT". `instrument` ham hâliyle korunur, bu fonksiyonun ürettiği
 * `baseAsset` ise iki borsadaki performansı yan yana koymayı sağlar —
 * mevcut veride 21 sembol her iki borsada da işlem görmüş.
 */

const QUOTE_SUFFIXES = ["USDT", "USDC", "BUSD", "USD"];

export function toBaseAsset(instrument: string): string {
  const clean = instrument.trim().toUpperCase();
  if (!clean) return "";

  // OKX ve benzeri tireli formatlar: "PUMP-USDT-SWAP" -> "PUMP"
  if (clean.includes("-")) return clean.split("-")[0];

  // Binance formatı: "PUMPUSDT" -> "PUMP".
  // "1000PEPE" gibi ölçekli tickerlar olduğu gibi kalır — 1000PEPE ile PEPE
  // farklı sözleşme büyüklükleri, birleştirmek yanıltıcı olurdu.
  for (const q of QUOTE_SUFFIXES) {
    if (clean.length > q.length && clean.endsWith(q)) return clean.slice(0, -q.length);
  }

  return clean;
}
