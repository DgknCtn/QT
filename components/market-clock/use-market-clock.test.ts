import { describe, it, expect } from "vitest";
import { computeState } from "./use-market-clock";

/**
 * Quarterly Theory session/cycle math.
 *
 * All fixtures are in August 2026, when New York is on EDT (UTC-4), so
 * `ET = UTC - 4`. Reference calendar:
 *   2026-08-10 Monday · 2026-08-14 Friday · 2026-08-15 Saturday · 2026-08-16 Sunday
 */

/** Builds an instant from an ET wall-clock time on the given 2026-08 date. */
function etTime(day: number, hour: number, minute = 0): Date {
  const utcHour = hour + 4;
  const dayShift = Math.floor(utcHour / 24);
  return new Date(
    Date.UTC(2026, 7, day + dayShift, utcHour % 24, minute, 0)
  );
}

const at = (d: Date) => computeState(d, "ET");

describe("computeState — session detection", () => {
  it.each([
    ["Asia",   18, "Asia"],
    ["Asia",   23, "Asia"],
    ["London",  0, "London"],
    ["London",  5, "London"],
    ["NY AM",   6, "NY AM"],
    ["NY AM",  11, "NY AM"],
    ["NY PM",  12, "NY PM"],
    ["NY PM",  17, "NY PM"],
  ])("%s session covers ET %i:00", (_name, hour, expected) => {
    expect(at(etTime(10, hour)).session.name).toBe(expected);
  });

  it("rolls from NY PM into Asia exactly at 18:00 ET", () => {
    expect(at(etTime(10, 17, 59)).session.name).toBe("NY PM");
    expect(at(etTime(10, 18, 0)).session.name).toBe("Asia");
  });

  /**
   * Regression: `hour12: false` makes Intl use the h24 cycle, which formats
   * midnight as hour "24" instead of "00". That pushed the whole 00:00–00:59 ET
   * hour past the `etH >= 18` test and reported London Q1 as Asia Q4 every
   * single day. The formatters now pin `hourCycle: "h23"`.
   */
  describe("the midnight hour (h23/h24 regression)", () => {
    it.each([0, 15, 30, 59])("ET 00:%i is London, not Asia", (minute) => {
      expect(at(etTime(10, 0, minute)).session.name).toBe("London");
    });

    it("starts London at Q1 Acc, not Asia's Q4", () => {
      const state = at(etTime(10, 0, 0));
      expect(state.activeQIndex).toBe(0);
      expect(state.session.quarters[state.activeQIndex].label).toBe("Acc");
    });

    it("formats the midnight clock as 00, not 24", () => {
      expect(at(etTime(10, 0, 5)).etTime).toBe("00:05:00");
    });

    it("keeps the market closed during Sunday's midnight hour", () => {
      expect(at(etTime(16, 0, 30)).marketClosed).toBe(true);
    });
  });
});

describe("computeState — 90-minute quarters", () => {
  // NY AM starts 06:00 ET; each quarter is 90 minutes.
  it.each([
    [6,  0, 0, "Acc"],
    [7, 29, 0, "Acc"],
    [7, 30, 1, "Manip"],
    [9,  0, 2, "Distr"],
    [10, 30, 3, "X"],
    [11, 59, 3, "X"],
  ])("ET %i:%i is Q%i (%s)", (hour, minute, expectedIndex, expectedLabel) => {
    const state = at(etTime(10, hour, minute));
    expect(state.activeQIndex).toBe(expectedIndex);
    expect(state.session.quarters[state.activeQIndex].label).toBe(expectedLabel);
  });

  it("never exceeds Q4 even at the very end of a session", () => {
    expect(at(etTime(10, 11, 59)).activeQIndex).toBe(3);
    expect(at(etTime(10, 23, 59)).activeQIndex).toBe(3);
  });
});

describe("computeState — 22.5-minute micro quarters", () => {
  it.each([
    [6, 0,  0],
    [6, 22, 0],
    [6, 23, 1],
    [6, 45, 2],
    [7, 15, 3],
  ])("ET %i:%i is micro %i", (hour, minute, expected) => {
    expect(at(etTime(10, hour, minute)).microIndex).toBe(expected);
  });

  it("resets to micro 0 at each new 90-minute quarter", () => {
    expect(at(etTime(10, 7, 30)).microIndex).toBe(0);
    expect(at(etTime(10, 9, 0)).microIndex).toBe(0);
  });

  it("reports the minutes left in the current micro quarter", () => {
    // 22.5-minute block starting 06:00 -> at 06:00 the whole block remains.
    expect(at(etTime(10, 6, 0)).microRemainingMin).toBe(23);
    expect(at(etTime(10, 6, 20)).microRemainingMin).toBe(3);
  });
});

describe("computeState — weekend market hours (Fri 18:00 ET → Sun 18:00 ET)", () => {
  it("is open during the trading week", () => {
    expect(at(etTime(10, 12)).marketClosed).toBe(false);
  });

  it("closes at Friday 18:00 ET, not before", () => {
    expect(at(etTime(14, 17, 59)).marketClosed).toBe(false);
    expect(at(etTime(14, 18, 0)).marketClosed).toBe(true);
  });

  it("stays closed all Saturday", () => {
    expect(at(etTime(15, 3)).marketClosed).toBe(true);
    expect(at(etTime(15, 12)).marketClosed).toBe(true);
    expect(at(etTime(15, 23)).marketClosed).toBe(true);
  });

  it("reopens at Sunday 18:00 ET", () => {
    expect(at(etTime(16, 17, 59)).marketClosed).toBe(true);
    expect(at(etTime(16, 18, 0)).marketClosed).toBe(false);
  });
});

describe("computeState — clock and timezone", () => {
  it("formats the ET wall clock", () => {
    expect(at(etTime(10, 9, 5)).etTime).toBe("09:05:00");
  });

  it("reports Istanbul as 7 hours ahead of ET during EDT, but only in TR view", () => {
    expect(computeState(etTime(10, 12), "TR").tzOffsetHours).toBe(7);
    // The offset is only meaningful when TR is displayed; ET view reports 0.
    expect(computeState(etTime(10, 12), "ET").tzOffsetHours).toBe(0);
  });

  it("labels the ET date", () => {
    expect(at(etTime(10, 12)).etDateLabel).toBe("Mon 10 Aug 2026");
  });
});
