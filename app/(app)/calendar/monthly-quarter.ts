export type QuarterBand = {
  quarter: 1 | 2 | 3 | 4;
  days: Date[]; // Mon, Tue, Wed, Thu
};

/** month is 1-12. Finds the first four full Mon-Thu blocks fully contained
 * within the month and labels them Q1-Q4, in order. A 5th full block (rare,
 * only possible in 31-day months) is left unlabeled by design. */
export function getMonthlyQuarterWeeks(year: number, month: number): QuarterBand[] {
  const bands: QuarterBand[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let d = 1; d <= daysInMonth && bands.length < 4; d++) {
    const date = new Date(year, month - 1, d);
    if (date.getDay() !== 1) continue; // only start on Monday

    const block: Date[] = [date];
    let full = true;
    for (let i = 1; i <= 3; i++) {
      const next = new Date(year, month - 1, d + i);
      if (next.getMonth() !== month - 1) { full = false; break; }
      block.push(next);
    }

    if (full) {
      bands.push({ quarter: (bands.length + 1) as 1 | 2 | 3 | 4, days: block });
    }
  }

  return bands;
}

export function dayQuarter(date: Date, bands: QuarterBand[]): 1 | 2 | 3 | 4 | null {
  for (const b of bands) {
    if (b.days.some((d) => d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate())) {
      return b.quarter;
    }
  }
  return null;
}
