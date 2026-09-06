/**
 * Enstrüman birim modeli ve pozisyon büyüklüğü hesabı.
 *
 * Var oluş sebebi: risk hesaplayıcı futures, forex ve kriptoyu **tek** bir
 * `riskDollar / (mesafe × dollarPerPoint)` formülünden geçiriyordu. Futures
 * için doğru, forex için değil — EUR/USD'de 100 USD risk ve 10 pip stop
 * `10.000 kontrat` üretiyordu; doğrusu ~1 standart lot.
 *
 * Buradaki ayrım şu: her enstrümanın "1 birimi" farklı bir şey (1 kontrat,
 * 1 standart lot = 100.000 baz birim, 1 coin) ve fiyatın 1 puan hareketinin
 * USD karşılığı bu birime bağlı. Formülü değil, birimi modelliyoruz.
 */

export type InstrumentType = "futures" | "forex" | "crypto";

/** Miktarın hangi birimde ifade edildiği — arayüzdeki etiketi belirler. */
export type QtyUnit = "contract" | "lot" | "coin";

export type Instrument = {
  symbol: string;
  label: string;
  type: InstrumentType;
  /** Enstrümanın fiyatlandığı para birimi. */
  quoteCurrency: string;
  /** 1 birimin kaç baz birim içerdiği (futures'ta 1, forex lotunda 100.000). */
  contractSize: number;
  /**
   * Fiyatın 1.0 hareketinin, 1 birim pozisyon için **quote currency**
   * cinsinden karşılığı. Futures'ta sözleşme çarpanı, forex'te contractSize,
   * kriptoda 1.
   */
  quotePerPricePoint: number;
  /** En küçük fiyat adımı. */
  tickSize: number;
  /** İşlem yapılabilir en küçük miktar. */
  minQty: number;
  /** Miktarın yuvarlanacağı adım. */
  qtyStep: number;
  qtyUnit: QtyUnit;
  /** Kripto için gösterim birimi (BTC, ETH…). */
  displayUnit?: string;
  /** Fiyat gösteriminde ondalık basamak. */
  priceDecimals: number;
};

const futures = (
  symbol: string,
  label: string,
  quotePerPricePoint: number,
  tickSize: number,
  priceDecimals = 2,
): Instrument => ({
  symbol, label, type: "futures", quoteCurrency: "USD",
  contractSize: 1, quotePerPricePoint, tickSize,
  minQty: 1, qtyStep: 1, qtyUnit: "contract", priceDecimals,
});

/**
 * Forex: 1 standart lot = 100.000 baz birim. Fiyatın 1.0 hareketi lot başına
 * 100.000 **quote currency** eder. USD quote'lu paritelerde bu doğrudan USD;
 * USD/JPY gibi USD-base paritelerde JPY'dir ve fiyata bölünerek USD'ye çevrilir
 * (bkz. `usdPerPricePoint`).
 */
const forex = (
  symbol: string,
  label: string,
  quoteCurrency: string,
  tickSize: number,
  priceDecimals: number,
): Instrument => ({
  symbol, label, type: "forex", quoteCurrency,
  contractSize: 100_000, quotePerPricePoint: 100_000, tickSize,
  minQty: 0.01, qtyStep: 0.01, qtyUnit: "lot", priceDecimals,
});

const crypto = (
  symbol: string,
  label: string,
  displayUnit: string,
  tickSize: number,
  qtyStep: number,
  priceDecimals: number,
): Instrument => ({
  symbol, label, type: "crypto", quoteCurrency: "USDT",
  contractSize: 1, quotePerPricePoint: 1, tickSize,
  minQty: qtyStep, qtyStep, qtyUnit: "coin", displayUnit, priceDecimals,
});

export const INSTRUMENTS: Record<string, Instrument> = {
  NQ:  futures("NQ",  "NQ  (Nasdaq Futures)",  20,  0.25),
  ES:  futures("ES",  "ES  (S&P 500 Futures)", 50,  0.25),
  YM:  futures("YM",  "YM  (Dow Futures)",     5,   1),
  RTY: futures("RTY", "RTY (Russell Futures)", 50,  0.10),
  MNQ: futures("MNQ", "MNQ (Micro Nasdaq)",    2,   0.25),
  MES: futures("MES", "MES (Micro S&P)",       5,   0.25),
  MYM: futures("MYM", "MYM (Micro Dow)",       0.5, 1),
  M2K: futures("M2K", "M2K (Micro Russell)",   5,   0.10),

  EURUSD: forex("EURUSD", "EUR/USD", "USD", 0.0001, 5),
  GBPUSD: forex("GBPUSD", "GBP/USD", "USD", 0.0001, 5),
  AUDUSD: forex("AUDUSD", "AUD/USD", "USD", 0.0001, 5),
  USDJPY: forex("USDJPY", "USD/JPY", "JPY", 0.01,   3),

  BTC:  crypto("BTC",  "BTC (Bitcoin)",     "BTC",  1,      0.0001, 2),
  ETH:  crypto("ETH",  "ETH (Ethereum)",    "ETH",  0.01,   0.001,  2),
  SOL:  crypto("SOL",  "SOL (Solana)",      "SOL",  0.01,   0.01,   2),
  BNB:  crypto("BNB",  "BNB",               "BNB",  0.01,   0.001,  2),
  XRP:  crypto("XRP",  "XRP (Ripple)",      "XRP",  0.0001, 0.1,    4),
  AVAX: crypto("AVAX", "AVAX (Avalanche)",  "AVAX", 0.01,   0.01,   2),
};

/**
 * Fiyatın 1.0 hareketinin, 1 birim pozisyon için **USD** karşılığı.
 *
 * USD/JPY gibi USD-base paritelerde quote currency JPY olduğu için sabit bir
 * "pip değeri 10$" varsayımı yanlıştır; değer kura bağlıdır. Giriş fiyatını
 * kur olarak kullanıyoruz — bu, sabit varsayımdan belirgin biçimde daha
 * doğru, ama yine de yaklaşıktır (hesap para birimi USD kabul ediliyor).
 */
export function usdPerPricePoint(inst: Instrument, price: number): number {
  if (inst.quoteCurrency === "USD" || inst.quoteCurrency === "USDT") {
    return inst.quotePerPricePoint;
  }
  // USD-base parite (USD/XXX): quote cinsinden değeri kura bölerek USD'ye çevir.
  if (inst.symbol.startsWith("USD") && price > 0) {
    return inst.quotePerPricePoint / price;
  }
  return inst.quotePerPricePoint;
}

/** Tick başına USD değeri — elle girilmez, birim modelinden türetilir. */
export function usdPerTick(inst: Instrument, price: number): number {
  return usdPerPricePoint(inst, price) * inst.tickSize;
}

export type PositionSize = {
  /** İşlem adımına yuvarlanmış, gerçekten girilebilir miktar. */
  qty: number;
  /** Yuvarlanmamış teorik miktar — "0.4 kontrat" gibi durumu göstermek için. */
  rawQty: number;
  qtyUnit: QtyUnit;
  /** Arayüzde gösterilecek birim adı ("kontrat", "lot", "BTC"). */
  unitLabel: string;
  /** 1 birimin stop'a kadarki USD riski. */
  riskPerUnitUsd: number;
  /** `qty` ile fiilen alınan USD riski (bütçeden küçük veya eşit). */
  riskAtQtyUsd: number;
  /** Risk bütçesi minimum işlem büyüklüğünü karşılamıyor. */
  belowMinimum: boolean;
};

/** Adım tabanlı aşağı yuvarlama. 0.1 + 0.2 sınıfı float artıklarını temizler. */
function floorToStep(value: number, step: number): number {
  if (step <= 0) return value;
  const steps = Math.floor(value / step + 1e-9);
  const decimals = (step.toString().split(".")[1] ?? "").length;
  return Number((steps * step).toFixed(decimals));
}

/**
 * Risk bütçesinden pozisyon büyüklüğü.
 *
 * Miktar **aşağı** yuvarlanır: yukarı yuvarlamak kullanıcıyı bütçesinden fazla
 * riske sokar, ki bu ürünün bütün amacına aykırıdır.
 */
export function positionSize(
  inst: Instrument,
  riskUsd: number,
  entry: number,
  stop: number,
): PositionSize | null {
  const distance = Math.abs(entry - stop);
  if (!(riskUsd > 0) || !(distance > 0) || !(entry > 0) || !(stop > 0)) return null;

  const riskPerUnitUsd = distance * usdPerPricePoint(inst, entry);
  if (!(riskPerUnitUsd > 0)) return null;

  const rawQty = riskUsd / riskPerUnitUsd;
  const qty = floorToStep(rawQty, inst.qtyStep);

  return {
    qty,
    rawQty,
    qtyUnit: inst.qtyUnit,
    unitLabel: unitLabelOf(inst),
    riskPerUnitUsd,
    riskAtQtyUsd: qty * riskPerUnitUsd,
    belowMinimum: qty < inst.minQty,
  };
}

export function unitLabelOf(inst: Instrument): string {
  if (inst.type === "crypto") return inst.displayUnit ?? "birim";
  return inst.qtyUnit === "lot" ? "lot" : "kontrat";
}

/** Miktar gösteriminde kullanılacak ondalık basamak — adımdan türetilir. */
export function qtyDecimals(inst: Instrument): number {
  return (inst.qtyStep.toString().split(".")[1] ?? "").length;
}
