import { describe, it, expect } from "vitest";
import { computeProcessScore } from "./process-score";

const good = {
  dailyPrepId: "p1",
  setupType: "SSMT",
  entryPrice: "21000",
  stopPrice: "20980",
  tp1: "21060",
  riskPercent: "1",
  goStatusAtEntry: "GO",
  planFollowed: "YES",
  result: "WIN",
};

describe("computeProcessScore", () => {
  it("eksiksiz ve kurallı işlem A+ alır", () => {
    const r = computeProcessScore(good, []);
    expect(r.score).toBe(11);
    expect(r.grade).toBe("A_PLUS");
  });

  it("doluluk ile kural uyumunu ayrı ölçer", () => {
    const r = computeProcessScore(good, []);
    expect(r.completeness).toBe(7);
    expect(r.compliance).toBe(4);
    expect(r.completeness + r.compliance).toBe(r.score);
  });

  it("eksiksiz doldurulmuş ama kural ihlali olan işlem ayırt edilir", () => {
    // Asil mesele: form doldurmak ile dogru karar vermek ayni sey degil.
    const r = computeProcessScore(
      { ...good, goStatusAtEntry: "NO_GO_BUT_ENTERED", planFollowed: "NO" },
      ["FOMO"],
    );
    expect(r.completeness).toBe(7);   // kayit hala eksiksiz
    expect(r.compliance).toBeLessThan(0); // ama karar kotu
  });

  it("stop yokluğu ağır cezalı — A+'tan C'ye düşürür", () => {
    const r = computeProcessScore({ ...good, stopPrice: "" }, []);
    expect(r.compliance).toBe(-1);
    expect(r.score).toBe(5);
    expect(r.grade).toBe("C");
  });

  it("boş kayıt RULE_BREAK", () => {
    expect(computeProcessScore({}, []).grade).toBe("RULE_BREAK");
  });
});
