import { describe, it, expect } from "vitest";
import { parseTradovateCsv } from "./parse-tradovate";

const USER = "user-1";

/** Builds a Tradovate-style Fills CSV from row tuples. */
function csv(rows: string[][], headers = ["Account", "Contract", "B/S", "avgPrice", "filledQty", "Fill Time"]) {
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

describe("parseTradovateCsv", () => {
  describe("header detection", () => {
    it("warns and imports nothing when the columns are unrecognized", () => {
      const result = parseTradovateCsv("foo,bar\n1,2", USER);
      expect(result.rows).toEqual([]);
      expect(result.warnings[0]).toMatch(/CSV kolonları tanınamadı/);
    });

    it("accepts alternative header spellings", () => {
      const result = parseTradovateCsv(
        csv(
          [["ACC1", "MNQZ4", "Buy", "100", "1", "2026-08-10T14:00:00Z"],
           ["ACC1", "MNQZ4", "Sell", "110", "1", "2026-08-10T14:05:00Z"]],
          ["Account", "Symbol", "Side", "Price", "Qty", "Timestamp"]
        ),
        USER
      );
      expect(result.rows).toHaveLength(1);
    });

    it("warns when no valid fill rows survive parsing", () => {
      const result = parseTradovateCsv(csv([["ACC1", "", "", "", "", ""]]), USER);
      expect(result.rows).toEqual([]);
      expect(result.warnings[0]).toMatch(/geçerli fill satırı bulunamadı/);
    });
  });

  describe("round-trip P&L", () => {
    it("computes a winning LONG on MNQ (multiplier 2)", () => {
      const { rows, warnings } = parseTradovateCsv(
        csv([
          ["ACC1", "MNQZ4", "Buy", "20000", "1", "2026-08-10T14:00:00Z"],
          ["ACC1", "MNQZ4", "Sell", "20010", "1", "2026-08-10T14:05:00Z"],
        ]),
        USER
      );

      expect(warnings).toEqual([]);
      expect(rows).toHaveLength(1);
      const t = rows[0];
      expect(t.instrument).toBe("MNQ");
      expect(t.direction).toBe("LONG");
      expect(t.quantity).toBe(1);
      expect(t.entryPrice).toBe(20000);
      expect(t.exitPrice).toBe(20010);
      // (20010 - 20000) * 2 * 1 = 20
      expect(t.grossPnl).toBe(20);
      expect(t.netPnl).toBe(20);
      expect(t.durationSec).toBe(300);
      expect(t.needsManualPnl).toBe(false);
    });

    it("computes a winning SHORT (direction flips the sign)", () => {
      const { rows } = parseTradovateCsv(
        csv([
          ["ACC1", "MNQZ4", "Sell", "20010", "1", "2026-08-10T14:00:00Z"],
          ["ACC1", "MNQZ4", "Buy", "20000", "1", "2026-08-10T14:05:00Z"],
        ]),
        USER
      );

      expect(rows[0].direction).toBe("SHORT");
      // (20000 - 20010) * 2 * 1 * -1 = 20
      expect(rows[0].grossPnl).toBe(20);
    });

    it("computes a losing LONG as a negative number", () => {
      const { rows } = parseTradovateCsv(
        csv([
          ["ACC1", "MNQZ4", "Buy", "20010", "1", "2026-08-10T14:00:00Z"],
          ["ACC1", "MNQZ4", "Sell", "20000", "1", "2026-08-10T14:05:00Z"],
        ]),
        USER
      );
      expect(rows[0].grossPnl).toBe(-20);
    });

    it("applies the NQ multiplier of 20", () => {
      const { rows } = parseTradovateCsv(
        csv([
          ["ACC1", "NQZ4", "Buy", "20000", "1", "2026-08-10T14:00:00Z"],
          ["ACC1", "NQZ4", "Sell", "20001", "1", "2026-08-10T14:05:00Z"],
        ]),
        USER
      );
      expect(rows[0].instrument).toBe("NQ");
      expect(rows[0].grossPnl).toBe(20);
    });

    it("subtracts commission and fees from net P&L", () => {
      const { rows } = parseTradovateCsv(
        csv(
          [
            ["ACC1", "MNQZ4", "Buy", "20000", "1", "2026-08-10T14:00:00Z", "1.5", "0.25"],
            ["ACC1", "MNQZ4", "Sell", "20010", "1", "2026-08-10T14:05:00Z", "1.5", "0.25"],
          ],
          ["Account", "Contract", "B/S", "avgPrice", "filledQty", "Fill Time", "Commission", "Fees"]
        ),
        USER
      );

      expect(rows[0].grossPnl).toBe(20);
      expect(rows[0].commission).toBe(3);
      expect(rows[0].fees).toBe(0.5);
      expect(rows[0].netPnl).toBe(20 - 3 - 0.5);
    });
  });

  describe("multi-fill positions", () => {
    it("volume-weights entry and exit across partial fills", () => {
      const { rows } = parseTradovateCsv(
        csv([
          ["ACC1", "MNQZ4", "Buy", "20000", "1", "2026-08-10T14:00:00Z"],
          ["ACC1", "MNQZ4", "Buy", "20020", "1", "2026-08-10T14:01:00Z"],
          ["ACC1", "MNQZ4", "Sell", "20030", "2", "2026-08-10T14:05:00Z"],
        ]),
        USER
      );

      expect(rows).toHaveLength(1);
      expect(rows[0].quantity).toBe(2);
      expect(rows[0].entryPrice).toBe(20010); // (20000 + 20020) / 2
      expect(rows[0].exitPrice).toBe(20030);
      // (20030 - 20010) * 2 * 2 = 80
      expect(rows[0].grossPnl).toBe(80);
    });

    it("splits consecutive flat-to-flat cycles into separate trades", () => {
      const { rows } = parseTradovateCsv(
        csv([
          ["ACC1", "MNQZ4", "Buy", "20000", "1", "2026-08-10T14:00:00Z"],
          ["ACC1", "MNQZ4", "Sell", "20010", "1", "2026-08-10T14:05:00Z"],
          ["ACC1", "MNQZ4", "Buy", "20020", "1", "2026-08-10T15:00:00Z"],
          ["ACC1", "MNQZ4", "Sell", "20030", "1", "2026-08-10T15:05:00Z"],
        ]),
        USER
      );
      expect(rows).toHaveLength(2);
      expect(rows.every((r) => r.grossPnl === 20)).toBe(true);
    });

    it("keeps different contracts and accounts in separate cycles", () => {
      const { rows } = parseTradovateCsv(
        csv([
          ["ACC1", "MNQZ4", "Buy", "20000", "1", "2026-08-10T14:00:00Z"],
          ["ACC2", "MNQZ4", "Buy", "20000", "1", "2026-08-10T14:00:00Z"],
          ["ACC1", "MNQZ4", "Sell", "20010", "1", "2026-08-10T14:05:00Z"],
          ["ACC2", "MNQZ4", "Sell", "20010", "1", "2026-08-10T14:05:00Z"],
        ]),
        USER
      );
      expect(rows).toHaveLength(2);
      expect(new Set(rows.map((r) => r.account))).toEqual(new Set(["ACC1", "ACC2"]));
    });

    it("orders fills chronologically regardless of CSV order", () => {
      const { rows } = parseTradovateCsv(
        csv([
          ["ACC1", "MNQZ4", "Sell", "20010", "1", "2026-08-10T14:05:00Z"],
          ["ACC1", "MNQZ4", "Buy", "20000", "1", "2026-08-10T14:00:00Z"],
        ]),
        USER
      );
      expect(rows[0].direction).toBe("LONG");
      expect(rows[0].entryPrice).toBe(20000);
    });
  });

  describe("edge cases", () => {
    it("warns and drops a position that never returns to flat", () => {
      const { rows, warnings } = parseTradovateCsv(
        csv([["ACC1", "MNQZ4", "Buy", "20000", "1", "2026-08-10T14:00:00Z"]]),
        USER
      );
      expect(rows).toEqual([]);
      expect(warnings.some((w) => w.includes("flat'a dönmedi"))).toBe(true);
    });

    it("flags contracts with no known point value instead of guessing P&L", () => {
      const { rows, warnings } = parseTradovateCsv(
        csv([
          ["ACC1", "ZZZ", "Buy", "100", "1", "2026-08-10T14:00:00Z"],
          ["ACC1", "ZZZ", "Sell", "110", "1", "2026-08-10T14:05:00Z"],
        ]),
        USER
      );

      expect(rows).toHaveLength(1);
      expect(rows[0].needsManualPnl).toBe(true);
      expect(rows[0].grossPnl).toBeNull();
      expect(rows[0].netPnl).toBeNull();
      expect(warnings.some((w) => w.includes("point-value"))).toBe(true);
    });

    it("strips the month/year code from the contract symbol", () => {
      const { rows } = parseTradovateCsv(
        csv([
          ["ACC1", "MESH5", "Buy", "5000", "1", "2026-08-10T14:00:00Z"],
          ["ACC1", "MESH5", "Sell", "5001", "1", "2026-08-10T14:05:00Z"],
        ]),
        USER
      );
      expect(rows[0].instrument).toBe("MES");
    });

    it("skips rows with unparseable price or timestamp", () => {
      const { rows } = parseTradovateCsv(
        csv([
          ["ACC1", "MNQZ4", "Buy", "abc", "1", "2026-08-10T14:00:00Z"],
          ["ACC1", "MNQZ4", "Buy", "20000", "1", "not-a-date"],
          ["ACC1", "MNQZ4", "Buy", "20000", "1", "2026-08-10T14:00:00Z"],
          ["ACC1", "MNQZ4", "Sell", "20010", "1", "2026-08-10T14:05:00Z"],
        ]),
        USER
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].grossPnl).toBe(20);
    });
  });

  describe("externalRef (import de-duplication key)", () => {
    const rowsFor = (user: string) =>
      parseTradovateCsv(
        csv([
          ["ACC1", "MNQZ4", "Buy", "20000", "1", "2026-08-10T14:00:00Z"],
          ["ACC1", "MNQZ4", "Sell", "20010", "1", "2026-08-10T14:05:00Z"],
        ]),
        user
      ).rows;

    it("is stable across identical re-imports", () => {
      expect(rowsFor(USER)[0].externalRef).toBe(rowsFor(USER)[0].externalRef);
    });

    it("differs between users so one user's import cannot collide with another's", () => {
      expect(rowsFor("user-1")[0].externalRef).not.toBe(rowsFor("user-2")[0].externalRef);
    });
  });
});
