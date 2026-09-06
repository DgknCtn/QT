import { describe, it, expect } from "vitest";
import {
  parseBinanceFuturesCsv,
  parseFeeCell,
  guessUtcOffsetFromFilename,
} from "./parse-binance-futures";

const HEADER =
  "Uid,Time,Symbol,Side,Price,Quantity,Amount,Fee,Realized Profit,Buyer,Maker,Trade ID,Order ID";

/** Test CSV'lerini okunur tutmak için: sadece anlamlı kolonları vermek yeter. */
function row(o: {
  time: string;
  symbol: string;
  side: "BUY" | "SELL";
  price: number;
  qty: number;
  fee?: string;
  pnl?: number;
  tradeId?: string;
}) {
  const amount = (o.price * o.qty).toFixed(4);
  return [
    "74055180",
    o.time,
    o.symbol,
    o.side,
    o.price,
    o.qty,
    amount,
    o.fee ?? "0.001USDT",
    o.pnl ?? 0,
    "false",
    "false",
    o.tradeId ?? "1",
    "999",
  ].join(",");
}

function csv(rows: string[]) {
  return [HEADER, ...rows].join("\n");
}

const UTC3 = 3;

describe("guessUtcOffsetFromFilename", () => {
  it("Binance'in dosya adındaki offset'i okur", () => {
    expect(
      guessUtcOffsetFromFilename("Binance-Futures-Trade-History-202608302008(UTC+3)-part1-of1.csv")
    ).toBe(3);
  });

  it("negatif offset ve UTC+0", () => {
    expect(guessUtcOffsetFromFilename("x(UTC-5)y.csv")).toBe(-5);
    expect(guessUtcOffsetFromFilename("x(UTC+0)y.csv")).toBe(0);
  });

  it("bulamazsa null döner — kullanıcıya sorulmalı", () => {
    expect(guessUtcOffsetFromFilename("trades.csv")).toBeNull();
  });
});

describe("parseFeeCell", () => {
  it("USDT ekli fee'yi ayrıştırır", () => {
    expect(parseFeeCell("0.00738570USDT")).toEqual({ amount: 0.0073857, asset: "USDT" });
  });

  it("BNB ile ödenen fee'nin asset'ini korur", () => {
    expect(parseFeeCell("0.00012BNB")).toEqual({ amount: 0.00012, asset: "BNB" });
  });

  it("boş/bozuk hücre sıfır döner", () => {
    expect(parseFeeCell("")).toEqual({ amount: 0, asset: "" });
    expect(parseFeeCell("—")).toEqual({ amount: 0, asset: "" });
  });
});

describe("parseBinanceFuturesCsv", () => {
  it("basit bir short round-trip'i pozisyona çevirir", () => {
    const { rows, warnings } = parseBinanceFuturesCsv(
      csv([
        row({ time: "2026-08-20 17:17:15", symbol: "ZECUSDT", side: "SELL", price: 566.39, qty: 0.881, tradeId: "100" }),
        row({ time: "2026-08-20 21:23:34", symbol: "ZECUSDT", side: "BUY", price: 565.82, qty: 0.881, pnl: 0.502, tradeId: "101" }),
      ]),
      "u1",
      UTC3
    );

    expect(warnings).toEqual([]);
    expect(rows).toHaveLength(1);
    const t = rows[0];
    expect(t.direction).toBe("SHORT");
    expect(t.instrument).toBe("ZECUSDT");
    expect(t.quantity).toBeCloseTo(0.881, 6);
    expect(t.entryPrice).toBeCloseTo(566.39, 4);
    expect(t.exitPrice).toBeCloseTo(565.82, 4);
    expect(t.grossPnl).toBeCloseTo(0.502, 6);
    expect(t.netPnl).toBeCloseTo(0.502 - 0.002, 6);
    expect(t.durationSec).toBe(4 * 3600 + 6 * 60 + 19);
  });

  it("ondalıklı kısmi kapanışlarda pozisyonu flat sayar (float epsilon)", () => {
    // 0.881 - 0.403 - 0.478 kayan noktada tam 0 etmez; katı === 0 kıyası
    // bu pozisyonu asla kapatmaz ve trade kaybolurdu.
    const { rows, warnings } = parseBinanceFuturesCsv(
      csv([
        row({ time: "2026-08-20 17:17:15", symbol: "ZECUSDT", side: "SELL", price: 566.39, qty: 0.881, tradeId: "1" }),
        row({ time: "2026-08-20 21:23:34", symbol: "ZECUSDT", side: "BUY", price: 565.82, qty: 0.403, pnl: 0.229, tradeId: "2" }),
        row({ time: "2026-08-20 21:23:34", symbol: "ZECUSDT", side: "BUY", price: 565.82, qty: 0.478, pnl: 0.272, tradeId: "3" }),
      ]),
      "u1",
      UTC3
    );

    expect(warnings).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(rows[0].grossPnl).toBeCloseTo(0.501, 6);
  });

  it("piramitleme: aynı yönde eklenen fill'ler tek pozisyon sayılır", () => {
    const { rows } = parseBinanceFuturesCsv(
      csv([
        row({ time: "2026-08-21 23:21:36", symbol: "ZECUSDT", side: "SELL", price: 718.6, qty: 0.278, tradeId: "1" }),
        row({ time: "2026-08-22 01:25:52", symbol: "ZECUSDT", side: "SELL", price: 723.93, qty: 0.276, tradeId: "2" }),
        row({ time: "2026-08-22 02:08:58", symbol: "ZECUSDT", side: "BUY", price: 736.4, qty: 0.554, pnl: -8.39, tradeId: "3" }),
      ]),
      "u1",
      UTC3
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].quantity).toBeCloseTo(0.554, 6);
    // giriş fiyatı miktara göre ağırlıklı ortalama
    expect(rows[0].entryPrice).toBeCloseTo((718.6 * 0.278 + 723.93 * 0.276) / 0.554, 4);
    expect(rows[0].grossPnl).toBeCloseTo(-8.39, 6);
  });

  it("saat dilimini offset olarak uygular ve QT çeyreğini ona göre belirler", () => {
    // 22:46 TR = 15:46 ET (yaz saati, EDT) -> NY PM seansı,
    // seans 12:00'de başlar: 226 dk sonra -> 3. 90dk bloğu = Q3
    const { rows } = parseBinanceFuturesCsv(
      csv([
        row({ time: "2026-08-30 22:46:50", symbol: "SOLUSDT", side: "SELL", price: 105.51, qty: 1, tradeId: "1" }),
        row({ time: "2026-08-30 22:50:00", symbol: "SOLUSDT", side: "BUY", price: 105.0, qty: 1, pnl: 0.51, tradeId: "2" }),
      ]),
      "u1",
      UTC3
    );

    expect(rows[0].entryTime).toBe("2026-08-30T19:46:50.000Z");
    expect(rows[0].session).toBe("NY_PM");
    expect(rows[0].quarter90).toBe("Q3");
  });

  it("yanlış offset farklı bir çeyreğe düşürür — offset seçimi kritik", () => {
    const asUtc = parseBinanceFuturesCsv(
      csv([
        row({ time: "2026-08-30 22:46:50", symbol: "SOLUSDT", side: "SELL", price: 105.51, qty: 1, tradeId: "1" }),
        row({ time: "2026-08-30 22:50:00", symbol: "SOLUSDT", side: "BUY", price: 105.0, qty: 1, pnl: 0.51, tradeId: "2" }),
      ]),
      "u1",
      0
    );
    // UTC okunursa 18:46 ET olur ve Asya seansına kayar
    expect(asUtc.rows[0].session).toBe("ASIA");
  });

  it("hafta sonu açılan pozisyonu da çeyreğe oturtur (kripto 7/24)", () => {
    // 2026-08-29 Cumartesi
    const { rows } = parseBinanceFuturesCsv(
      csv([
        row({ time: "2026-08-29 12:00:00", symbol: "BTCUSDT", side: "BUY", price: 100, qty: 1, tradeId: "1" }),
        row({ time: "2026-08-29 13:00:00", symbol: "BTCUSDT", side: "SELL", price: 101, qty: 1, pnl: 1, tradeId: "2" }),
      ]),
      "u1",
      UTC3
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].session).not.toBeNull();
    expect(rows[0].quarter90).toMatch(/^Q[1-4]$/);
  });

  it("dosya öncesinden açık pozisyonun kapanışını atlar ve uyarır", () => {
    // Dosya, daha önce açılmış bir short'un kapanışıyla başlıyor: ilk fill kâr
    // realize ediyor, yani bir açılış olamaz. Yürüyüş onu yeni bir long
    // sanıp sonraki SELL ile "kapatır" — giriş fiyatı uydurma olurdu.
    const { rows, warnings } = parseBinanceFuturesCsv(
      csv([
        row({ time: "2026-08-11 14:16:35", symbol: "ENAUSDT", side: "BUY", price: 0.5, qty: 100, pnl: 12.3, tradeId: "1" }),
        row({ time: "2026-08-11 15:00:00", symbol: "ENAUSDT", side: "SELL", price: 0.52, qty: 100, pnl: 2, tradeId: "2" }),
      ]),
      "u1",
      UTC3
    );

    expect(rows).toHaveLength(0);
    expect(warnings.join(" ")).toMatch(/dosya başlamadan önce açılmış/);
  });

  it("tek başına duran kapanış artığını 'açık pozisyon' sanmaz", () => {
    const { rows, warnings } = parseBinanceFuturesCsv(
      csv([row({ time: "2026-08-11 14:16:35", symbol: "ENAUSDT", side: "BUY", price: 0.5, qty: 100, pnl: 12.3, tradeId: "1" })]),
      "u1",
      UTC3
    );

    expect(rows).toHaveLength(0);
    expect(warnings.join(" ")).toMatch(/dosya başlamadan önce açılmış/);
  });

  it("dosya sonunda açık kalan pozisyonu içe aktarmaz ve uyarır", () => {
    const { rows, warnings } = parseBinanceFuturesCsv(
      csv([row({ time: "2026-08-30 22:41:58", symbol: "ZECUSDT", side: "SELL", price: 863.13, qty: 0.232, tradeId: "1" })]),
      "u1",
      UTC3
    );

    expect(rows).toHaveLength(0);
    expect(warnings.join(" ")).toMatch(/hâlâ açık pozisyon/);
  });

  it("farklı sembolleri birbirine karıştırmaz", () => {
    const { rows } = parseBinanceFuturesCsv(
      csv([
        row({ time: "2026-08-20 10:00:00", symbol: "SOLUSDT", side: "BUY", price: 100, qty: 1, tradeId: "1" }),
        row({ time: "2026-08-20 10:01:00", symbol: "BTCUSDT", side: "SELL", price: 60000, qty: 1, tradeId: "2" }),
        row({ time: "2026-08-20 10:02:00", symbol: "SOLUSDT", side: "SELL", price: 101, qty: 1, pnl: 1, tradeId: "3" }),
        row({ time: "2026-08-20 10:03:00", symbol: "BTCUSDT", side: "BUY", price: 59000, qty: 1, pnl: 1000, tradeId: "4" }),
      ]),
      "u1",
      UTC3
    );

    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((r) => r.instrument))).toEqual(new Set(["SOLUSDT", "BTCUSDT"]));
  });

  it("USDT dışı fee için uyarır", () => {
    const { warnings } = parseBinanceFuturesCsv(
      csv([
        row({ time: "2026-08-20 10:00:00", symbol: "SOLUSDT", side: "BUY", price: 100, qty: 1, fee: "0.0001BNB", tradeId: "1" }),
        row({ time: "2026-08-20 10:02:00", symbol: "SOLUSDT", side: "SELL", price: 101, qty: 1, pnl: 1, tradeId: "2" }),
      ]),
      "u1",
      UTC3
    );

    expect(warnings.join(" ")).toMatch(/BNB/);
  });

  it("USDT dışı fee net P&L'den düşülmez, ayrı tutulur", () => {
    // Regresyon: BNB cinsinden bir fee doğrudan USDT kârından çıkarılıyordu.
    // Birim olarak geçersiz; artık netPnl'e karışmıyor.
    const { rows } = parseBinanceFuturesCsv(
      csv([
        row({ time: "2026-08-20 10:00:00", symbol: "SOLUSDT", side: "BUY", price: 100, qty: 1, fee: "0.5BNB", tradeId: "1" }),
        row({ time: "2026-08-20 10:02:00", symbol: "SOLUSDT", side: "SELL", price: 101, qty: 1, fee: "0.002USDT", pnl: 1, tradeId: "2" }),
      ]),
      "u1",
      UTC3
    );

    const t = rows[0];
    expect(t.grossPnl).toBeCloseTo(1, 6);
    // Yalnızca USDT fee düşülür; 0.5 BNB netPnl'i 0.5 USDT azaltmaz.
    expect(t.fees).toBeCloseTo(0.002, 6);
    expect(t.netPnl).toBeCloseTo(1 - 0.002, 6);
    expect(t.uncountedFees).toEqual({ BNB: 0.5 });
    expect(t.costDataIncomplete).toBe(true);
  });

  it("externalRef Trade ID'lerden türer, yani tekrar import'ta aynı kalır", () => {
    const input = csv([
      row({ time: "2026-08-20 10:00:00", symbol: "SOLUSDT", side: "BUY", price: 100, qty: 1, tradeId: "555" }),
      row({ time: "2026-08-20 10:02:00", symbol: "SOLUSDT", side: "SELL", price: 101, qty: 1, pnl: 1, tradeId: "556" }),
    ]);

    const a = parseBinanceFuturesCsv(input, "u1", UTC3).rows[0];
    const b = parseBinanceFuturesCsv(input, "u1", UTC3).rows[0];
    expect(a.externalRef).toBe(b.externalRef);
    expect(a.externalRef).toContain("555");
    expect(a.externalRef).toContain("556");
  });

  it("tanınmayan başlıklarda boş sonuç ve açıklayıcı uyarı döner", () => {
    const { rows, warnings } = parseBinanceFuturesCsv("Foo,Bar\n1,2", "u1", UTC3);
    expect(rows).toEqual([]);
    expect(warnings.join(" ")).toMatch(/kolonları tanınamadı/);
  });
});
