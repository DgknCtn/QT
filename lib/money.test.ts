import { describe, it, expect } from "vitest";
import { formatUsd, formatR } from "./money";

describe("formatUsd", () => {
  it("negatifte eksi işareti kaybolmaz — bu modülün var oluş sebebi", () => {
    expect(formatUsd(-125, { decimals: 0 })).toBe("−$125");
    expect(formatUsd(-125.4)).toBe("−$125.40");
  });

  it("pozitifte varsayılan olarak işaret koymaz, signed ile koyar", () => {
    expect(formatUsd(125, { decimals: 0 })).toBe("$125");
    expect(formatUsd(125, { decimals: 0, signed: true })).toBe("+$125");
  });

  it("yuvarlandığında sıfır olan tutara eksi koymaz", () => {
    expect(formatUsd(-0.4, { decimals: 0 })).toBe("$0");
    expect(formatUsd(-0.004)).toBe("$0.00");
  });

  it("binlik ayracı kullanır", () => {
    expect(formatUsd(-12345.6, { decimals: 2 })).toBe("−$12,345.60");
  });

  it("veri yoksa tire döner — sıfırla karıştırılmasın", () => {
    expect(formatUsd(null)).toBe("—");
    expect(formatUsd(undefined)).toBe("—");
    expect(formatUsd(NaN)).toBe("—");
  });
});

describe("formatR", () => {
  it("işareti her zaman gösterir", () => {
    expect(formatR(-1.25)).toBe("−1.25R");
    expect(formatR(1.25)).toBe("+1.25R");
    expect(formatR(0)).toBe("0.00R");
    expect(formatR(null)).toBe("—");
  });
});
