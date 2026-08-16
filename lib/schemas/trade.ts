import { z } from "zod";

/** Validates the risk-critical numeric integrity of a trade form.
 * Only enforces rules when the relevant fields are present — empty optional
 * fields are allowed (e.g. NO_TRADE / MISSED rows, or partial drafts). */

function numFromForm(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

// `.optional()` matters: without it a *missing* key fails with zod's internal
// "expected nonoptional, received undefined" message, which contradicts the
// contract above and would surface to the user verbatim.
const num = z
  .unknown()
  .optional()
  .transform(numFromForm)
  .refine((n) => n === null || Number.isFinite(n), "Geçersiz sayı");

const tradeIntegritySchema = z
  .object({
    direction: z.string().optional(),
    entryPrice: num,
    stopPrice: num,
    tp1: num,
    riskPercent: num,
  })
  .superRefine((d, ctx) => {
    if (d.entryPrice !== null && d.entryPrice <= 0)
      ctx.addIssue({ code: "custom", message: "Giriş fiyatı pozitif olmalı", path: ["entryPrice"] });
    if (d.stopPrice !== null && d.stopPrice <= 0)
      ctx.addIssue({ code: "custom", message: "Stop fiyatı pozitif olmalı", path: ["stopPrice"] });
    if (d.riskPercent !== null && d.riskPercent < 0)
      ctx.addIssue({ code: "custom", message: "Risk % negatif olamaz", path: ["riskPercent"] });
    if (d.riskPercent !== null && d.riskPercent > 100)
      ctx.addIssue({ code: "custom", message: "Risk % 100'den büyük olamaz", path: ["riskPercent"] });

    // Direction-based stop integrity (only when both prices present)
    if (d.entryPrice !== null && d.stopPrice !== null && d.entryPrice !== d.stopPrice) {
      if (d.direction === "LONG" && d.stopPrice >= d.entryPrice)
        ctx.addIssue({ code: "custom", message: "LONG işlemde stop, girişin altında olmalı", path: ["stopPrice"] });
      if (d.direction === "SHORT" && d.stopPrice <= d.entryPrice)
        ctx.addIssue({ code: "custom", message: "SHORT işlemde stop, girişin üstünde olmalı", path: ["stopPrice"] });
    }
  });

/** Throws an Error with a readable message if the trade form fails integrity checks. */
export function assertValidTrade(form: Record<string, unknown>): void {
  const result = tradeIntegritySchema.safeParse(form);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new Error(first?.message ?? "Trade doğrulaması başarısız");
  }
}
