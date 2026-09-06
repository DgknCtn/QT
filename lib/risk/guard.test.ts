import { describe, it, expect } from "vitest";
import { computeGuardState } from "./guard";
import { computePerformance, computeAfterLoss } from "./performance";

const NOW = new Date("2026-08-20T18:00:00");

/** Test gününde belirli bir saat/dakika. */
function at(h: number, m: number, day = "2026-08-20") {
  return new Date(`${day}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
}

/** Bugün kapanan bir pozisyon. `h` kapanış saati. */
function t(h: number, netPnl: number | null, day = "2026-08-20") {
  const exit = new Date(`${day}T${String(h).padStart(2, "0")}:00:00`);
  return { entryTime: exit, exitTime: exit, netPnl };
}

describe("computeGuardState", () => {
  it("limit yokken kural kapalı sayılır", () => {
    const s = computeGuardState([t(10, -500)], { dailyLossLimitUsd: 0, maxConsecutiveLosses: 0 }, NOW);
    expect(s.disabled).toBe(true);
    expect(s.shouldStop).toBe(false);
    expect(s.remainingUsd).toBeNull();
    expect(s.usedRatio).toBeNull();
  });

  it("günlük limit aşılınca durdurur", () => {
    const s = computeGuardState(
      [t(10, -120), t(11, -90)],
      { dailyLossLimitUsd: 200, maxConsecutiveLosses: 0 },
      NOW
    );
    expect(s.todayPnl).toBeCloseTo(-210, 6);
    expect(s.breaches).toContain("DAILY_LOSS");
    expect(s.shouldStop).toBe(true);
    expect(s.remainingUsd).toBe(0);
    expect(s.usedRatio).toBe(1);
  });

  it("limite tam değince de durdurur (sınır dahil)", () => {
    const s = computeGuardState([t(10, -200)], { dailyLossLimitUsd: 200, maxConsecutiveLosses: 0 }, NOW);
    expect(s.shouldStop).toBe(true);
  });

  it("limit aşılmadıysa kalan mesafeyi verir", () => {
    const s = computeGuardState([t(10, -75)], { dailyLossLimitUsd: 200, maxConsecutiveLosses: 0 }, NOW);
    expect(s.shouldStop).toBe(false);
    expect(s.remainingUsd).toBeCloseTo(125, 6);
    expect(s.usedRatio).toBeCloseTo(0.375, 6);
  });

  it("kârdayken limitin tamamı kullanılabilir kalır", () => {
    // İyi bir sabah, kötü bir öğleden sonrayı finanse etmemeli: zarar limiti
    // günün kârına göre değil sıfıra göre ölçülür.
    const s = computeGuardState([t(10, 300)], { dailyLossLimitUsd: 200, maxConsecutiveLosses: 0 }, NOW);
    expect(s.todayPnl).toBe(300);
    expect(s.remainingUsd).toBe(200);
    expect(s.usedRatio).toBe(0);
  });

  it("ardışık kayıp serisini günün sonundan geriye sayar", () => {
    const s = computeGuardState(
      [t(9, -10), t(10, 40), t(11, -10), t(12, -10)],
      { dailyLossLimitUsd: 0, maxConsecutiveLosses: 2 },
      NOW
    );
    expect(s.consecutiveLosses).toBe(2);
    expect(s.breaches).toContain("CONSECUTIVE_LOSSES");
  });

  it("son işlem kazançsa seri sıfırlanır", () => {
    const s = computeGuardState(
      [t(9, -10), t(10, -10), t(11, 5)],
      { dailyLossLimitUsd: 0, maxConsecutiveLosses: 2 },
      NOW
    );
    expect(s.consecutiveLosses).toBe(0);
    expect(s.shouldStop).toBe(false);
  });

  it("dünkü işlemleri bugüne saymaz", () => {
    const s = computeGuardState(
      [t(10, -500, "2026-08-19"), t(11, -20)],
      { dailyLossLimitUsd: 200, maxConsecutiveLosses: 0 },
      NOW
    );
    expect(s.todayCount).toBe(1);
    expect(s.todayPnl).toBeCloseTo(-20, 6);
    expect(s.shouldStop).toBe(false);
  });

  it("iki kural birden aşılabilir", () => {
    const s = computeGuardState(
      [t(10, -150), t(11, -150)],
      { dailyLossLimitUsd: 200, maxConsecutiveLosses: 2 },
      NOW
    );
    expect(s.breaches).toEqual(["DAILY_LOSS", "CONSECUTIVE_LOSSES"]);
  });

  it("P&L'i olmayan pozisyonlar seriyi bozmaz", () => {
    const s = computeGuardState([t(10, null), t(11, -10)], { dailyLossLimitUsd: 100, maxConsecutiveLosses: 3 }, NOW);
    expect(s.todayPnl).toBeCloseTo(-10, 6);
    expect(s.consecutiveLosses).toBe(1);
  });
});

describe("computePerformance", () => {
  it("boş girdide çökmez", () => {
    const p = computePerformance([]);
    expect(p.count).toBe(0);
    expect(p.payoff).toBeNull();
    expect(p.expectancy).toBeNull();
  });

  it("payoff ve beklentiyi hesaplar", () => {
    // 3 kazanç ort +10, 1 kayıp −30 -> payoff 0.33, beklenti 0
    const p = computePerformance([t(9, 10), t(10, 10), t(11, 10), t(12, -30)]);
    expect(p.winRate).toBeCloseTo(0.75, 6);
    expect(p.avgWin).toBeCloseTo(10, 6);
    expect(p.avgLoss).toBeCloseTo(-30, 6);
    expect(p.payoff).toBeCloseTo(1 / 3, 6);
    expect(p.expectancy).toBeCloseTo(0, 6);
    expect(p.profitFactor).toBeCloseTo(1, 6);
  });

  it("yüksek kazanma oranının negatif beklentiyi gizleyebildiğini gösterir", () => {
    // Gerçek verideki örüntü: sık kazan, büyük kaybet.
    const p = computePerformance([t(9, 12), t(10, 12), t(11, 12), t(12, -60)]);
    expect(p.winRate).toBeCloseTo(0.75, 6);
    expect(p.expectancy).toBeLessThan(0);
    // Başabaş için gereken kazanma oranı, gerçekleşenin üstünde olmalı
    expect(p.breakEvenWinRate!).toBeGreaterThan(p.winRate!);
  });

  it("en uzun kayıp serisini kronolojik bulur", () => {
    const p = computePerformance([t(9, -1), t(10, -1), t(11, 5), t(12, -1), t(13, -1), t(14, -1)]);
    expect(p.maxConsecutiveLosses).toBe(3);
  });

  it("en kötü 5 işlemin yoğunlaşmasını ölçer", () => {
    const p = computePerformance([t(9, -100), t(10, -50), t(11, -30), t(12, -20), t(13, -10), t(14, 200)]);
    expect(p.worstTrade).toBe(-100);
    expect(p.worst5Sum).toBeCloseTo(-210, 6);
  });

  it("sıfır işlemi kayıp saymaz", () => {
    const p = computePerformance([t(9, 0), t(10, 10)]);
    expect(p.wins).toBe(1);
    expect(p.losses).toBe(0);
  });
});

describe("computeAfterLoss", () => {
  it("büyük kayıptan sonraki işlemleri ayırır", () => {
    const r = computeAfterLoss([t(9, -80), t(10, -40), t(11, 20), t(12, -60), t(13, -30)], 50);
    // -80 ve -60 eşiği aşıyor; onlardan sonrakiler: -40 ve -30
    expect(r.count).toBe(2);
    expect(r.avgAfterLoss).toBeCloseTo(-35, 6);
  });

  it("eşiği aşan kayıp yoksa null döner", () => {
    const r = computeAfterLoss([t(9, -10), t(10, -10)], 50);
    expect(r.count).toBe(0);
    expect(r.avgAfterLoss).toBeNull();
  });

  it("genel ortalama pozitifken oran hesaplamaz", () => {
    const r = computeAfterLoss([t(9, -60), t(10, 500)], 50);
    expect(r.ratio).toBeNull();
  });

  it("kayıp gerçekleşmeden açılmış pozisyonu tepki saymaz", () => {
    // Asıl regresyon: sıralama kapanışa göreydi. Burada ikinci pozisyon
    // 08:00'de açılmış, yani ilk kaybın 09:00'daki gerçekleşmesinden ÖNCE.
    // İkincisi ilkinin sonucuna tepki olamaz; intikam işlemi demek hatalı.
    const first  = { entryTime: at(8, 0), exitTime: at(9, 0),  netPnl: -80 };
    const overlap = { entryTime: at(8, 30), exitTime: at(10, 0), netPnl: -40 };
    const r = computeAfterLoss([first, overlap], 50);
    expect(r.count).toBe(0);
    expect(r.avgAfterLoss).toBeNull();
  });

  it("kayıptan sonra açılan pozisyonu sayar", () => {
    const first = { entryTime: at(8, 0), exitTime: at(9, 0), netPnl: -80 };
    const after = { entryTime: at(9, 15), exitTime: at(10, 0), netPnl: -40 };
    const r = computeAfterLoss([first, after], 50);
    expect(r.count).toBe(1);
    expect(r.avgAfterLoss).toBe(-40);
  });

  it("pencere dışındaki işlem tepki değil, yeni bir karardır", () => {
    const first = { entryTime: at(8, 0), exitTime: at(9, 0), netPnl: -80 };
    const late  = { entryTime: at(20, 0), exitTime: at(21, 0), netPnl: -40 };
    expect(computeAfterLoss([first, late], 50).count).toBe(0);
    // Pencere genisletilirse sayilir — esik keyfi degil, acikca parametre.
    expect(computeAfterLoss([first, late], 50, 24 * 60).count).toBe(1);
  });

  it("açılış anı bilinmeyen adayı sessizce dahil etmez, sayar", () => {
    const first = { exitTime: at(9, 0), netPnl: -80 };
    const next  = { exitTime: at(10, 0), netPnl: -40 };
    const r = computeAfterLoss([first, next], 50);
    expect(r.count).toBe(0);
    expect(r.unverifiable).toBe(1);
  });
});

describe("gün sınırı piyasa gününe (ET) göre", () => {
  it("gece yarısına yakın kapanan zarar ertesi güne kaçmaz", () => {
    // 21 Ağustos 02:00 UTC = 20 Ağustos 22:00 ET. Sunucu UTC'de olduğunda
    // eskiden bu işlem 21 Ağustos'a yazılıyor ve günün limitinden kurtuluyordu.
    const late = {
      entryTime: new Date("2026-08-21T02:00:00Z"),
      exitTime: new Date("2026-08-21T02:00:00Z"),
      netPnl: -600,
    };
    const now = new Date("2026-08-21T02:30:00Z"); // hâlâ 20 Ağustos seansı
    const s = computeGuardState([late], { dailyLossLimitUsd: 500, maxConsecutiveLosses: 0 }, now);

    expect(s.todayCount).toBe(1);
    expect(s.todayPnl).toBe(-600);
    expect(s.breaches).toContain("DAILY_LOSS");
    expect(s.shouldStop).toBe(true);
  });

  it("ET gün dönümünden sonraki işlem yeni güne yazılır", () => {
    const prevDay = {
      entryTime: new Date("2026-08-21T03:00:00Z"), // 20 Ağu 23:00 ET
      exitTime: new Date("2026-08-21T03:00:00Z"),
      netPnl: -600,
    };
    const now = new Date("2026-08-21T05:00:00Z"); // 21 Ağu 01:00 ET
    const s = computeGuardState([prevDay], { dailyLossLimitUsd: 500, maxConsecutiveLosses: 0 }, now);

    expect(s.todayCount).toBe(0);
    expect(s.shouldStop).toBe(false);
  });
});
