import { describe, it, expect } from "vitest";
import {
  FormValidationError,
  optionalDate,
  optionalInt,
  optionalNumber,
  optionalString,
  requiredDate,
  requiredEnum,
  requiredInt,
  requiredNumber,
  requiredString,
} from "./form";

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

describe("requiredString", () => {
  it("returns a trimmed value", () => {
    expect(requiredString(fd({ name: "  QT  " }), "name")).toBe("QT");
  });

  it("rejects a missing or blank field with the label in the message", () => {
    expect(() => requiredString(fd({}), "firmName", "Firma adı")).toThrow(/Firma adı zorunlu/);
    expect(() => requiredString(fd({ firmName: "   " }), "firmName", "Firma adı")).toThrow(
      FormValidationError
    );
  });
});

describe("optionalString", () => {
  it("maps missing and blank to null", () => {
    expect(optionalString(fd({}), "notes")).toBeNull();
    expect(optionalString(fd({ notes: "  " }), "notes")).toBeNull();
  });

  it("keeps a real value", () => {
    expect(optionalString(fd({ notes: "ok" }), "notes")).toBe("ok");
  });
});

describe("requiredNumber", () => {
  it("parses integers and decimals, including negatives", () => {
    expect(requiredNumber(fd({ p: "20100.25" }), "p")).toBe(20100.25);
    expect(requiredNumber(fd({ p: "-5" }), "p")).toBe(-5);
    expect(requiredNumber(fd({ p: "0" }), "p")).toBe(0);
  });

  it("rejects a blank field instead of yielding NaN", () => {
    expect(() => requiredNumber(fd({ price: "" }), "price", "Fiyat")).toThrow(/Fiyat zorunlu/);
  });

  it("rejects non-numeric text instead of yielding NaN", () => {
    expect(() => requiredNumber(fd({ price: "abc" }), "price", "Fiyat")).toThrow(
      /Fiyat geçerli bir sayı olmalı/
    );
  });

  it("rejects values parseFloat would silently truncate", () => {
    // parseFloat("12abc") === 12 -- Number() correctly rejects it.
    expect(() => requiredNumber(fd({ price: "12abc" }), "price")).toThrow(FormValidationError);
  });
});

describe("optionalNumber", () => {
  it("maps blank to null but still rejects garbage", () => {
    expect(optionalNumber(fd({ x: "" }), "x")).toBeNull();
    expect(optionalNumber(fd({}), "x")).toBeNull();
    expect(() => optionalNumber(fd({ x: "abc" }), "x")).toThrow(FormValidationError);
  });
});

describe("requiredInt / optionalInt", () => {
  it("accepts whole numbers", () => {
    expect(requiredInt(fd({ phase: "2" }), "phase")).toBe(2);
    expect(optionalInt(fd({ n: "" }), "n")).toBeNull();
  });

  it("rejects fractions", () => {
    expect(() => requiredInt(fd({ phase: "2.5" }), "phase", "Faz")).toThrow(/Faz tam sayı olmalı/);
  });
});

describe("dates", () => {
  it("parses an ISO date", () => {
    expect(requiredDate(fd({ d: "2026-08-10" }), "d").toISOString()).toContain("2026-08-10");
  });

  it("maps blank optional dates to null", () => {
    expect(optionalDate(fd({ d: "" }), "d")).toBeNull();
  });

  it("rejects an unparseable date instead of producing Invalid Date", () => {
    expect(() => requiredDate(fd({ d: "not-a-date" }), "d", "Tarih")).toThrow(
      /Tarih geçerli bir tarih olmalı/
    );
  });
});

describe("requiredEnum", () => {
  const IMPACTS = ["HIGH", "MEDIUM", "LOW"] as const;

  it("accepts a declared member", () => {
    expect(requiredEnum(fd({ impact: "HIGH" }), "impact", IMPACTS)).toBe("HIGH");
  });

  it("rejects anything else, quoting the bad value", () => {
    expect(() => requiredEnum(fd({ impact: "URGENT" }), "impact", IMPACTS, "Etki")).toThrow(
      /Etki geçersiz: "URGENT"/
    );
  });
});
