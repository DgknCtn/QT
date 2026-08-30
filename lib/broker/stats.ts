import type { Session, QuarterCycle } from "@prisma/client";

/** Kronolojik seans sırası (ET): gün Asya ile başlar. */
export const SESSION_ORDER: { key: Session; label: string }[] = [
  { key: "ASIA", label: "Asya" },
  { key: "LONDON", label: "Londra" },
  { key: "NY_AM", label: "NY AM" },
  { key: "NY_PM", label: "NY PM" },
];

export const QUARTER_ORDER: QuarterCycle[] = ["Q1", "Q2", "Q3", "Q4"];

export type CellStat = { net: number; count: number; wins: number };

export type TradeLike = {
  netPnl: number | null;
  grossPnl: number | null;
  fees: number | null;
  fundingFee: number | null;
  instrument: string;
  session: Session | null;
  quarter90: QuarterCycle | null;
};

/**
 * Seans × çeyrek hücrelerini kurar.
 *
 * Toplama SQL yerine burada yapılıyor: kazanma oranı için hem sayıya hem
 * kazanan sayısına aynı anda ihtiyaç var, ve pozisyon adedi (yüzler
 * mertebesinde) tek geçişte rahatça dönülüyor.
 */
export function buildQuarterCells(trades: TradeLike[]) {
  const cells = new Map<string, CellStat>();

  for (const t of trades) {
    if (!t.session || !t.quarter90) continue;
    const key = `${t.session}|${t.quarter90}`;
    const cur = cells.get(key) ?? { net: 0, count: 0, wins: 0 };
    const net = t.netPnl ?? 0;
    cells.set(key, {
      net: cur.net + net,
      count: cur.count + 1,
      wins: cur.wins + (net > 0 ? 1 : 0),
    });
  }

  let maxAbs = 0;
  for (const c of cells.values()) maxAbs = Math.max(maxAbs, Math.abs(c.net));

  return { cells, maxAbs };
}

export type SymbolStat = {
  instrument: string;
  net: number;
  count: number;
  wins: number;
  fees: number;
};

/** Sembol bazlı performans — en kötüden en iyiye değil, mutlak etkiye göre sıralanır. */
export function buildSymbolStats(trades: TradeLike[]): SymbolStat[] {
  const map = new Map<string, SymbolStat>();

  for (const t of trades) {
    const cur = map.get(t.instrument) ?? {
      instrument: t.instrument,
      net: 0,
      count: 0,
      wins: 0,
      fees: 0,
    };
    const net = t.netPnl ?? 0;
    map.set(t.instrument, {
      instrument: t.instrument,
      net: cur.net + net,
      count: cur.count + 1,
      wins: cur.wins + (net > 0 ? 1 : 0),
      fees: cur.fees + (t.fees ?? 0),
    });
  }

  return [...map.values()].sort((a, b) => b.net - a.net);
}

/**
 * Fee sürüklemesi.
 *
 * Kripto perp'te asıl sinsi maliyet burası: brüt kâr artıda görünürken
 * fee'ler sonucu eksiye çevirebiliyor.
 */
export function buildFeeSummary(trades: TradeLike[]) {
  let gross = 0;
  let fees = 0;
  let funding = 0;
  for (const t of trades) {
    gross += t.grossPnl ?? 0;
    fees += t.fees ?? 0;
    funding += t.fundingFee ?? 0;
  }
  // Her iki alan da maliyet sözleşmesinde: pozitif = cebinden çıktı.
  // Funding negatif olabilir, o zaman funding sana ödemiş demektir.
  const net = gross - fees - funding;

  return {
    gross,
    fees,
    funding,
    net,
    /** Toplam maliyetin brüt kâra oranı — brüt zarardaysa oransızdır. */
    feeRatio: gross > 0 ? (fees + funding) / gross : null,
  };
}
