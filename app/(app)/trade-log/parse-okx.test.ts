import { describe, it, expect } from "vitest";
import { parseOkxCsv, parseOkxPreamble } from "./parse-okx";

const HEADER =
  "id,Order id,Time,Trade Type,Symbol,Action,Amount,Trading Unit,Filled Price,PnL,Fee,Fee Unit,Position Change,Position Balance,Balance Change,Balance,Balance Unit";

const PREAMBLE = "UID:187310626144690176,Account Type:Main,Time Zone:UTC+3";

let autoId = 1000;

function row(o: {
  time: string;
  symbol: string;
  action: string;
  amount: number;
  price?: number;
  pnl?: number;
  fee?: number;
  id?: string;
}) {
  return [
    o.id ?? String(autoId++),
    "3857628560027324416",
    o.time,
    o.action.startsWith("Funding") || o.action.startsWith("Transfer") ? "Swap" : "Swap",
    o.symbol,
    o.action,
    o.amount,
    "cont",
    (o.price ?? 100).toFixed(8),
    (o.pnl ?? 0).toFixed(8),
    (o.fee ?? 0).toFixed(8), // OKX negatif yazar
    "USDT",
    "0.00000000",
    "0.00000000",
    "0.00000000",
    "100.00000000",
    "USDT",
  ].join(",");
}

/** OKX her satırın başına BOM koyar — testler de gerçeği taklit etsin. */
function csv(rows: string[], { bom = true, preamble = PREAMBLE } = {}) {
  const b = bom ? "﻿" : "";
  return [b + preamble, b + HEADER, ...rows.map((r) => b + r)].join("\n");
}

describe("parseOkxPreamble", () => {
  it("UID, hesap tipi ve saat dilimini okur", () => {
    expect(parseOkxPreamble(PREAMBLE)).toEqual({
      uid: "187310626144690176",
      accountType: "Main",
      utcOffset: 3,
    });
  });

  it("alan aralarındaki BOM'ları temizler", () => {
    const withBoms = "﻿UID:123,﻿Account Type:Main,﻿Time Zone:UTC-5";
    expect(parseOkxPreamble(withBoms)).toEqual({
      uid: "123",
      accountType: "Main",
      utcOffset: -5,
    });
  });

  it("saat dilimi yoksa null döner", () => {
    expect(parseOkxPreamble("UID:123,Account Type:Main").utcOffset).toBeNull();
  });
});

describe("parseOkxCsv", () => {
  it("basit bir long round-trip'i pozisyona çevirir", () => {
    const { rows, warnings } = parseOkxCsv(
      csv([
        row({ time: "2026-08-10 15:30:21", symbol: "TAO-USDT-SWAP", action: "Open long", amount: 98, price: 204, fee: -0.5, id: "1" }),
        row({ time: "2026-08-12 06:06:16", symbol: "TAO-USDT-SWAP", action: "Close long", amount: 98, price: 205.1, pnl: 1.078, fee: -0.5, id: "2" }),
      ])
    );

    expect(warnings).toEqual([]);
    expect(rows).toHaveLength(1);
    const t = rows[0];
    expect(t.source).toBe("OKX");
    expect(t.direction).toBe("LONG");
    expect(t.instrument).toBe("TAO-USDT-SWAP");
    expect(t.baseAsset).toBe("TAO");
    expect(t.quantity).toBe(98);
    expect(t.grossPnl).toBeCloseTo(1.078, 6);
    // OKX negatif fee yazar; maliyet sözleşmesinde pozitif olmalı
    expect(t.fees).toBeCloseTo(1.0, 6);
    expect(t.netPnl).toBeCloseTo(1.078 - 1.0, 6);
    expect(t.account).toBe("187310626144690176");
  });

  it("piramitlemeyi tek pozisyon sayar (gerçek TAO senaryosu)", () => {
    const { rows } = parseOkxCsv(
      csv([
        row({ time: "2026-08-12 18:21:17", symbol: "TAO-USDT-SWAP", action: "Open long", amount: 73, price: 199.6 }),
        row({ time: "2026-08-12 18:21:17", symbol: "TAO-USDT-SWAP", action: "Open long", amount: 4, price: 199.6 }),
        row({ time: "2026-08-12 18:21:17", symbol: "TAO-USDT-SWAP", action: "Open long", amount: 23, price: 199.6 }),
        row({ time: "2026-08-19 23:33:27", symbol: "TAO-USDT-SWAP", action: "Close long", amount: 100, price: 201, pnl: 1.4 }),
      ])
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].quantity).toBe(100);
    expect(rows[0].grossPnl).toBeCloseTo(1.4, 6);
  });

  it("yönü Action'dan okur — net miktardan tahmin etmez", () => {
    // Short pozisyonda ilk fill bir SATIŞ; miktara bakan bir motor da SHORT
    // derdi, ama asıl güvence Action'ın kendisi.
    const { rows } = parseOkxCsv(
      csv([
        row({ time: "2026-08-23 08:00:00", symbol: "PUMP-USDT-SWAP", action: "Open short", amount: 35, price: 0.0052 }),
        row({ time: "2026-08-23 10:04:49", symbol: "PUMP-USDT-SWAP", action: "Close short", amount: 35, price: 0.005187, pnl: -90.96 }),
      ])
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].direction).toBe("SHORT");
    expect(rows[0].grossPnl).toBeCloseTo(-90.96, 4);
  });

  it("funding'i pozisyon penceresine göre atar", () => {
    const { rows } = parseOkxCsv(
      csv([
        row({ time: "2026-08-20 10:00:00", symbol: "WIF-USDT-SWAP", action: "Open long", amount: 10 }),
        row({ time: "2026-08-20 15:00:00", symbol: "WIF-USDT-SWAP", action: "Funding fee expense", amount: 10, pnl: -0.4 }),
        row({ time: "2026-08-20 23:00:00", symbol: "WIF-USDT-SWAP", action: "Funding fee income", amount: 10, pnl: 0.1 }),
        row({ time: "2026-08-21 10:00:00", symbol: "WIF-USDT-SWAP", action: "Close long", amount: 10, pnl: 5 }),
      ])
    );

    expect(rows).toHaveLength(1);
    // net funding PnL = -0.3 -> maliyet olarak +0.3
    expect(rows[0].fundingFee).toBeCloseTo(0.3, 6);
    expect(rows[0].netPnl).toBeCloseTo(5 - 0.3, 6);
  });

  it("pozisyon penceresi dışındaki funding'i atamaz", () => {
    const { rows } = parseOkxCsv(
      csv([
        row({ time: "2026-08-20 10:00:00", symbol: "WIF-USDT-SWAP", action: "Open long", amount: 10 }),
        row({ time: "2026-08-20 12:00:00", symbol: "WIF-USDT-SWAP", action: "Close long", amount: 10, pnl: 5 }),
        // pozisyon kapandıktan sonra gelen funding hiçbir pozisyona ait değil
        row({ time: "2026-08-25 15:00:00", symbol: "WIF-USDT-SWAP", action: "Funding fee expense", amount: 10, pnl: -9.9 }),
      ])
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].fundingFee).toBe(0);
    expect(rows[0].netPnl).toBeCloseTo(5, 6);
  });

  it("başka sembolün funding'ini karıştırmaz", () => {
    const { rows } = parseOkxCsv(
      csv([
        row({ time: "2026-08-20 10:00:00", symbol: "WIF-USDT-SWAP", action: "Open long", amount: 10 }),
        row({ time: "2026-08-20 11:00:00", symbol: "PUMP-USDT-SWAP", action: "Funding fee expense", amount: 10, pnl: -5 }),
        row({ time: "2026-08-20 12:00:00", symbol: "WIF-USDT-SWAP", action: "Close long", amount: 10, pnl: 5 }),
      ])
    );

    expect(rows[0].fundingFee).toBe(0);
  });

  it("transfer satırlarını atlar ve uyarır", () => {
    const { rows, warnings } = parseOkxCsv(
      csv([
        row({ time: "2026-08-20 10:00:00", symbol: "", action: "Transfer out", amount: 0 }),
        row({ time: "2026-08-20 10:30:00", symbol: "", action: "Transfer in", amount: 0 }),
        row({ time: "2026-08-20 11:00:00", symbol: "SOL-USDT-SWAP", action: "Open long", amount: 5 }),
        row({ time: "2026-08-20 12:00:00", symbol: "SOL-USDT-SWAP", action: "Close long", amount: 5, pnl: 2 }),
      ])
    );

    expect(rows).toHaveLength(1);
    expect(warnings.join(" ")).toMatch(/2 para transferi/);
  });

  it("saat dilimini preamble'dan okur ve çeyreği ona göre belirler", () => {
    // 22:46 UTC+3 = 19:46 UTC = 15:46 ET (EDT) -> NY PM, 12:00'den 226 dk sonra -> Q3
    const { rows, meta } = parseOkxCsv(
      csv([
        row({ time: "2026-08-30 22:46:50", symbol: "SOL-USDT-SWAP", action: "Open long", amount: 1 }),
        row({ time: "2026-08-30 22:50:00", symbol: "SOL-USDT-SWAP", action: "Close long", amount: 1, pnl: 1 }),
      ])
    );

    expect(meta?.utcOffset).toBe(3);
    expect(rows[0].entryTime).toBe("2026-08-30T19:46:50.000Z");
    expect(rows[0].session).toBe("NY_PM");
    expect(rows[0].quarter90).toBe("Q3");
  });

  it("kullanıcı saat dilimini elle geçebilir", () => {
    const input = csv([
      row({ time: "2026-08-30 22:46:50", symbol: "SOL-USDT-SWAP", action: "Open long", amount: 1 }),
      row({ time: "2026-08-30 22:50:00", symbol: "SOL-USDT-SWAP", action: "Close long", amount: 1, pnl: 1 }),
    ]);

    // UTC olarak okunursa 18:46 ET olur ve Asya seansına kayar
    expect(parseOkxCsv(input, 0).rows[0].session).toBe("ASIA");
  });

  it("Close ile başlayan pozisyonu atlar ve uyarır", () => {
    const { rows, warnings } = parseOkxCsv(
      csv([
        row({ time: "2026-07-15 15:30:02", symbol: "ENA-USDT-SWAP", action: "Close short", amount: 20, pnl: 3 }),
        row({ time: "2026-07-15 16:00:00", symbol: "ENA-USDT-SWAP", action: "Open short", amount: 20 }),
        row({ time: "2026-07-15 17:00:00", symbol: "ENA-USDT-SWAP", action: "Close short", amount: 20, pnl: 1 }),
      ])
    );

    // İlk "Close" dosyadan önce açılmış bir pozisyonun kapanışı; sonraki
    // Open/Close çifti geçerli.
    expect(rows).toHaveLength(1);
    expect(rows[0].grossPnl).toBeCloseTo(1, 6);
    expect(warnings.join(" ")).toMatch(/dosya başlamadan önce açılmış/);
  });

  it("dosya sonunda açık kalan pozisyonu içe aktarmaz", () => {
    const { rows, warnings } = parseOkxCsv(
      csv([row({ time: "2026-08-23 10:00:00", symbol: "MU-USDT-SWAP", action: "Open short", amount: 7 })])
    );

    expect(rows).toHaveLength(0);
    expect(warnings.join(" ")).toMatch(/hâlâ açık pozisyon/);
  });

  it("BOM'suz dosyayı da okur", () => {
    const { rows } = parseOkxCsv(
      csv(
        [
          row({ time: "2026-08-20 10:00:00", symbol: "SOL-USDT-SWAP", action: "Open long", amount: 5 }),
          row({ time: "2026-08-20 12:00:00", symbol: "SOL-USDT-SWAP", action: "Close long", amount: 5, pnl: 2 }),
        ],
        { bom: false }
      )
    );

    expect(rows).toHaveLength(1);
  });

  it("externalRef id'lerden türer, tekrar import'ta aynı kalır", () => {
    const input = csv([
      row({ time: "2026-08-20 10:00:00", symbol: "SOL-USDT-SWAP", action: "Open long", amount: 5, id: "777" }),
      row({ time: "2026-08-20 12:00:00", symbol: "SOL-USDT-SWAP", action: "Close long", amount: 5, pnl: 2, id: "778" }),
    ]);

    const a = parseOkxCsv(input).rows[0];
    const b = parseOkxCsv(input).rows[0];
    expect(a.externalRef).toBe(b.externalRef);
    expect(a.externalRef).toContain("777");
    expect(a.externalRef).toContain("778");
  });

  it("tanınmayan başlıklarda boş sonuç ve açıklayıcı uyarı döner", () => {
    const { rows, warnings } = parseOkxCsv("UID:1\nFoo,Bar\n1,2");
    expect(rows).toEqual([]);
    expect(warnings.join(" ")).toMatch(/kolonları tanınamadı/);
  });

  it("farklı sembolleri birbirine karıştırmaz", () => {
    const { rows } = parseOkxCsv(
      csv([
        row({ time: "2026-08-20 10:00:00", symbol: "SOL-USDT-SWAP", action: "Open long", amount: 5 }),
        row({ time: "2026-08-20 10:01:00", symbol: "BTC-USDT-SWAP", action: "Open short", amount: 1 }),
        row({ time: "2026-08-20 10:02:00", symbol: "SOL-USDT-SWAP", action: "Close long", amount: 5, pnl: 2 }),
        row({ time: "2026-08-20 10:03:00", symbol: "BTC-USDT-SWAP", action: "Close short", amount: 1, pnl: 10 }),
      ])
    );

    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((r) => r.baseAsset))).toEqual(new Set(["SOL", "BTC"]));
  });
});
