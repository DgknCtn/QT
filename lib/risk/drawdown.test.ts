import { describe, it, expect } from "vitest";
import { maxDrawdownR } from "./drawdown";

const curve = (...cum: number[]) => cum.map((cumR) => ({ cumR }));

describe("maxDrawdownR", () => {
  it("baştaki 0R'ı tepe sayar — regresyon testi", () => {
    // İki işlem de -1R: kümülatif -1R, -2R. Eski kod 1R diyordu.
    expect(maxDrawdownR(curve(-1, -2))).toBe(2);
  });

  it("tepe sonrası düşüşü ölçer", () => {
    expect(maxDrawdownR(curve(2, 5, 1, 3))).toBe(4);
  });

  it("sürekli yükselen eğride düşüş yoktur", () => {
    expect(maxDrawdownR(curve(1, 2, 3))).toBe(0);
  });

  it("boş eğri 0 döner", () => {
    expect(maxDrawdownR([])).toBe(0);
  });
});
