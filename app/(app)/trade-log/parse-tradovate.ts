import Papa from "papaparse";
import { createHash } from "crypto";

export type ParsedTradeRow = {
  key: string;
  source: "TRADOVATE";
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
  needsManualPnl: boolean;
};

export type ParseResult = {
  rows: ParsedTradeRow[];
  warnings: string[];
};

// $ value per 1.00 point move, per contract. Extend as needed.
const CONTRACT_MULTIPLIERS: Record<string, number> = {
  MNQ: 2, NQ: 20,
  MES: 5, ES: 50,
  MYM: 0.5, YM: 5,
  M2K: 5, RTY: 50,
  MGC: 10, GC: 100,
  MCL: 100, CL: 1000,
  SIL: 1000,
};

const ACCOUNT_KEYS = ["Account"];
const CONTRACT_KEYS = ["Contract", "Symbol"];
const SIDE_KEYS = ["B/S", "Side", "Action"];
const PRICE_KEYS = ["avgPrice", "Avg Fill Price", "Fill Price", "Price"];
const QTY_KEYS = ["filledQty", "Filled Qty", "Qty", "Quantity"];
const TIME_KEYS = ["Fill Time", "Timestamp", "Date/Time", "Date"];
const COMMISSION_KEYS = ["Commission", "Comm"];
const FEES_KEYS = ["Fees", "Fee"];

function findHeader(headers: string[], candidates: string[]): string | null {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const c of candidates) {
    const idx = lower.indexOf(c.toLowerCase());
    if (idx !== -1) return headers[idx];
  }
  return null;
}

function contractRoot(contract: string): string {
  const clean = contract.trim().toUpperCase();
  const m = clean.match(/^([A-Z]{1,3})[FGHJKMNQUVXZ]\d{1,2}$/);
  return m ? m[1] : clean;
}

type Fill = {
  account: string | null;
  root: string;
  side: "Buy" | "Sell";
  qty: number;
  price: number;
  time: Date;
  commission: number;
  fees: number;
};

export function parseTradovateCsv(csvText: string, userId: string): ParseResult {
  const warnings: string[] = [];
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = parsed.meta.fields ?? [];
  const accountKey = findHeader(headers, ACCOUNT_KEYS);
  const contractKey = findHeader(headers, CONTRACT_KEYS);
  const sideKey = findHeader(headers, SIDE_KEYS);
  const priceKey = findHeader(headers, PRICE_KEYS);
  const qtyKey = findHeader(headers, QTY_KEYS);
  const timeKey = findHeader(headers, TIME_KEYS);
  const commissionKey = findHeader(headers, COMMISSION_KEYS);
  const feesKey = findHeader(headers, FEES_KEYS);

  if (!contractKey || !sideKey || !priceKey || !qtyKey || !timeKey) {
    warnings.push(
      "CSV kolonları tanınamadı. Tradovate 'Fills' raporu export ettiğinizden emin olun (Account Reports → Fills → Export CSV)."
    );
    return { rows: [], warnings };
  }

  const fills: Fill[] = [];
  for (const row of parsed.data) {
    const contractRaw = row[contractKey];
    const sideRaw = row[sideKey];
    const priceRaw = row[priceKey];
    const qtyRaw = row[qtyKey];
    const timeRaw = row[timeKey];
    if (!contractRaw || !sideRaw || !priceRaw || !qtyRaw || !timeRaw) continue;

    const qty = Math.abs(parseFloat(qtyRaw));
    const price = parseFloat(priceRaw);
    const time = new Date(timeRaw);
    if (!qty || Number.isNaN(price) || Number.isNaN(time.getTime())) continue;

    const side: "Buy" | "Sell" = sideRaw.trim().toUpperCase().startsWith("B") ? "Buy" : "Sell";

    fills.push({
      account: accountKey ? (row[accountKey] || null) : null,
      root: contractRoot(contractRaw),
      side,
      qty,
      price,
      time,
      commission: commissionKey ? parseFloat(row[commissionKey] || "0") || 0 : 0,
      fees: feesKey ? parseFloat(row[feesKey] || "0") || 0 : 0,
    });
  }

  if (fills.length === 0) {
    warnings.push("Dosyada geçerli fill satırı bulunamadı.");
    return { rows: [], warnings };
  }

  // Group fills by account + contract root, sort chronologically, then
  // walk flat -> flat cycles: a trade starts when position leaves 0 and
  // ends the moment it returns to 0.
  const groups = new Map<string, Fill[]>();
  for (const f of fills) {
    const gKey = `${f.account ?? ""}|${f.root}`;
    if (!groups.has(gKey)) groups.set(gKey, []);
    groups.get(gKey)!.push(f);
  }

  const rows: ParsedTradeRow[] = [];

  for (const groupFills of groups.values()) {
    groupFills.sort((a, b) => a.time.getTime() - b.time.getTime());

    let position = 0;
    let cycle: Fill[] = [];

    for (const f of groupFills) {
      const signedQty = f.side === "Buy" ? f.qty : -f.qty;
      cycle.push(f);
      position += signedQty;

      if (position === 0 && cycle.length > 0) {
        rows.push(buildTradeRow(cycle, userId, warnings));
        cycle = [];
      }
    }

    if (cycle.length > 0) {
      warnings.push(
        `${groupFills[0].root} için pozisyon dönem sonunda flat'a dönmedi — açık kalan fill'ler içe aktarılmadı.`
      );
    }
  }

  rows.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
  return { rows, warnings };
}

function buildTradeRow(cycle: Fill[], userId: string, warnings: string[]): ParsedTradeRow {
  const first = cycle[0];
  const direction: "LONG" | "SHORT" = first.side === "Buy" ? "LONG" : "SHORT";
  const openingSide = first.side;

  const opening = cycle.filter((f) => f.side === openingSide);
  const closing = cycle.filter((f) => f.side !== openingSide);

  const entryQty = opening.reduce((s, f) => s + f.qty, 0);
  const exitQty = closing.reduce((s, f) => s + f.qty, 0);
  const quantity = Math.min(entryQty, exitQty) || entryQty || exitQty;

  const entryPrice = opening.length
    ? opening.reduce((s, f) => s + f.price * f.qty, 0) / entryQty
    : first.price;
  const exitPrice = closing.length
    ? closing.reduce((s, f) => s + f.price * f.qty, 0) / exitQty
    : first.price;

  const entryTime = new Date(Math.min(...opening.map((f) => f.time.getTime())));
  const exitTime = new Date(Math.max(...closing.map((f) => f.time.getTime()), entryTime.getTime()));

  const commission = cycle.reduce((s, f) => s + f.commission, 0);
  const fees = cycle.reduce((s, f) => s + f.fees, 0);

  const multiplier = CONTRACT_MULTIPLIERS[first.root];
  const needsManualPnl = multiplier == null;
  const grossPnl = needsManualPnl
    ? null
    : (exitPrice - entryPrice) * multiplier * quantity * (direction === "LONG" ? 1 : -1);
  const netPnl = grossPnl == null ? null : grossPnl - commission - fees;

  if (needsManualPnl) {
    warnings.push(`${first.root} için point-value tanımlı değil — P&L manuel girilmeli.`);
  }

  const durationSec = Math.max(0, Math.round((exitTime.getTime() - entryTime.getTime()) / 1000));

  const externalRef = createHash("sha256")
    .update(`${userId}|${first.account ?? ""}|${first.root}|${entryTime.toISOString()}|${exitTime.toISOString()}|${quantity}`)
    .digest("hex");

  return {
    key: externalRef,
    source: "TRADOVATE",
    account: first.account,
    instrument: first.root,
    direction,
    quantity,
    entryPrice,
    exitPrice,
    entryTime: entryTime.toISOString(),
    exitTime: exitTime.toISOString(),
    durationSec,
    grossPnl,
    commission: commission || null,
    fees: fees || null,
    netPnl,
    externalRef,
    needsManualPnl,
  };
}
