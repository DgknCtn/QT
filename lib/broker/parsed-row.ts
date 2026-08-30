import type { Session, QuarterCycle } from "@prisma/client";
import type { BrokerSource } from "./sources";

export type { BrokerSource };

/** İçe aktarma önizlemesinde gösterilen, henüz kaydedilmemiş bir pozisyon. */
export type ParsedTradeRow = {
  key: string;
  source: BrokerSource;
  account: string | null;
  instrument: string;
  direction: "LONG" | "SHORT";
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: string; // ISO
  exitTime: string; // ISO
  durationSec: number;
  grossPnl: number | null;
  commission: number | null;
  fees: number | null;
  netPnl: number | null;
  externalRef: string;
  /** Broker P&L vermediği için kullanıcıdan beklenen durum (Tradovate). */
  needsManualPnl: boolean;
  /** Perp funding maliyeti (pozitif = ödedin). Funding'i olmayan kaynaklarda null. */
  fundingFee: number | null;
  /** Borsadan bağımsız coin kimliği — bkz. lib/broker/symbols.ts */
  baseAsset: string | null;
  /** Pozisyonun açılış anının QT karşılığı — ET tanımlı. */
  session: Session | null;
  quarter90: QuarterCycle | null;
  quarterMicro: QuarterCycle | null;
};

export type ParseResult = {
  rows: ParsedTradeRow[];
  warnings: string[];
  /**
   * Dosyanın kendisinden okunabilen bilgiler. OKX saat dilimini export'un
   * içine yazar, yani arayüz bir tahmin değil tespit gösterebilir.
   */
  meta?: {
    utcOffset?: number;
    account?: string;
  };
};
