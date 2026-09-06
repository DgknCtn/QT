import { describe, it, expect } from "vitest";
import { rankMatchCandidates, normalizeInstrument } from "./match";

const broker = {
  instrument: "PUMP-USDT-SWAP",
  direction: "LONG",
  entryTime: new Date("2026-08-20T10:00:00"),
};

const candidate = (o: Partial<Parameters<typeof rankMatchCandidates>[1][number]>) => ({
  id: "t1",
  date: new Date("2026-08-20T00:00:00"),
  instrument: "PUMPUSDT",
  direction: "LONG",
  setupType: "SSMT",
  result: "WIN",
  ...o,
});

describe("normalizeInstrument", () => {
  it("iki borsanın aynı coin'i için aynı kimliği verir", () => {
    // Kural lib/broker/symbols.ts'te; burada yalnızca eşleştirmenin ona
    // dayandığını sabitliyoruz.
    expect(normalizeInstrument("PUMP-USDT-SWAP")).toBe(normalizeInstrument("PUMPUSDT"));
  });
});

describe("rankMatchCandidates", () => {
  it("gün + yön + enstrüman tutan aday en üstte", () => {
    const ranked = rankMatchCandidates(broker, [
      candidate({ id: "zayif", direction: "SHORT", instrument: "BTCUSDT", date: new Date("2026-08-10") }),
      candidate({ id: "tam" }),
    ]);
    expect(ranked[0].id).toBe("tam");
    expect(ranked[0].score).toBe(3);
    expect(ranked[0].reasons).toEqual(["aynı gün", "aynı yön", "aynı enstrüman"]);
  });

  it("zayıf adayları elemiyor, sıralıyor", () => {
    // Kullanici enstrumani journal'a farkli yazmis olabilir; karar onun.
    const ranked = rankMatchCandidates(broker, [
      candidate({ id: "a", instrument: "BAŞKA" }),
      candidate({ id: "b" }),
    ]);
    expect(ranked).toHaveLength(2);
    expect(ranked[0].id).toBe("b");
  });

  it("hiç aday yoksa boş döner", () => {
    expect(rankMatchCandidates(broker, [])).toEqual([]);
  });
});
