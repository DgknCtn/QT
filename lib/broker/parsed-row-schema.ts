import { z } from "zod";

/**
 * `commitImport` sınırında çalışan doğrulama.
 *
 * Ayrıştırma ve kaydetme iki ayrı server action: ayrıştırılan satırlar
 * önizleme için istemciye gidiyor ve oradan geri geliyor. Yani sunucunun
 * gördüğü satırlar parser'ın ürettikleri DEĞİL — arada her alan yeniden
 * yazılabilir. `userId` oturumdan zorlandığı için başkasının verisine
 * yazılamıyor, ama doğrulanmamış bir `NaN` netPnl tüm broker-log
 * toplamlarını kalıcı olarak zehirler.
 */

/** Tek seferde kabul edilen en fazla pozisyon. */
export const MAX_IMPORT_ROWS = 5000;

/** JSON'da NaN/Infinity yoktur ama string'den parse edilen sayı sonsuz olabilir. */
const finite = z.number().refine(Number.isFinite, "sonlu bir sayı olmalı");
const finiteNullable = finite.nullable();

const isoDate = z.string().refine(
  (v) => !Number.isNaN(new Date(v).getTime()),
  "geçerli bir tarih olmalı"
);

export const parsedTradeRowSchema = z.object({
  key: z.string().min(1).max(300),
  source: z.enum(["TRADOVATE", "BINANCE_FUTURES", "OKX"]),
  account: z.string().max(200).nullable(),
  instrument: z.string().min(1).max(100),
  direction: z.enum(["LONG", "SHORT"]),
  quantity: finite.positive(),
  entryPrice: finite,
  exitPrice: finite,
  entryTime: isoDate,
  exitTime: isoDate,
  durationSec: z.number().int().min(0),
  grossPnl: finiteNullable,
  commission: finiteNullable,
  fees: finiteNullable,
  netPnl: finiteNullable,
  externalRef: z.string().min(1).max(300),
  needsManualPnl: z.boolean(),
  fundingFee: finiteNullable,
  baseAsset: z.string().max(50).nullable(),
  session: z.enum(["LONDON", "NY_AM", "NY_PM", "ASIA"]).nullable(),
  quarter90: z.enum(["Q1", "Q2", "Q3", "Q4"]).nullable(),
  quarterMicro: z.enum(["Q1", "Q2", "Q3", "Q4"]).nullable(),
});

export const importPayloadSchema = z
  .array(parsedTradeRowSchema)
  .max(MAX_IMPORT_ROWS, `Tek seferde en fazla ${MAX_IMPORT_ROWS} pozisyon içe aktarılabilir.`);

export type ValidatedTradeRow = z.infer<typeof parsedTradeRowSchema>;
