"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAccount } from "./actions";
import type { FundedAccount } from "@/app/generated/prisma/client";

const STATUSES = ["ACTIVE", "PASSED", "FAILED", "REVIEW"] as const;

interface Props { account?: FundedAccount | null }

export function AccountForm({ account }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData(formRef.current!);
    startTransition(async () => {
      await saveAccount(account?.id ?? null, form);
      router.push("/accounts");
    });
  }

  const field = "rounded-lg border px-3 py-2 text-sm w-full focus:outline-none focus:ring-1";
  const fs = { background: "var(--color-bg-surface)", borderColor: "var(--color-bg-border)", color: "var(--color-text-primary)" };
  const label = (t: string) => (
    <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>{t}</label>
  );

  // defaults for new account
  const starting = account?.startingBalance ?? 10000;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          {label("Firma Adı")}
          <input name="firmName" defaultValue={account?.firmName ?? "BEM Funding"} required className={field} style={fs} />
        </div>
        <div>
          {label("Phase")}
          <select name="phase" defaultValue={account?.phase ?? 1} className={field} style={fs}>
            <option value={1}>Phase 1</option>
            <option value={2}>Phase 2</option>
            <option value={3}>Funded</option>
          </select>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          {label("Hesap ID (opsiyonel)")}
          <input name="accountId" defaultValue={account?.accountId ?? ""} placeholder="BEM-123456" className={field} style={fs} />
        </div>
        <div>
          {label("Durum")}
          <select name="status" defaultValue={account?.status ?? "ACTIVE"} className={field} style={fs}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Row 3 — Balances */}
      <p className="text-xs font-semibold uppercase tracking-wide pt-1" style={{ color: "var(--color-text-muted)" }}>Bakiye & Kurallar</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          {label("Başlangıç Bakiyesi ($)")}
          <input name="startingBalance" type="number" step="0.01" defaultValue={account?.startingBalance ?? 10000} required className={field} style={fs} />
        </div>
        <div>
          {label("Güncel Equity ($)")}
          <input name="currentEquity" type="number" step="0.01" defaultValue={account?.currentEquity ?? starting} required className={field} style={fs} />
        </div>
      </div>

      {/* Row 4 — Limits */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          {label("Profit Hedefi ($)")}
          <input name="profitTarget" type="number" step="0.01" defaultValue={account?.profitTarget ?? 900} required className={field} style={fs} placeholder="900" />
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>BEM Phase 1 → %9 · Phase 2 → %4.5</p>
        </div>
        <div>
          {label("Max Günlük Kayıp ($)")}
          <input name="maxDailyLoss" type="number" step="0.01" defaultValue={account?.maxDailyLoss ?? 450} required className={field} style={fs} placeholder="450" />
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>BEM → %4.5 günlük</p>
        </div>
        <div>
          {label("Max Toplam Kayıp ($)")}
          <input name="maxTotalLoss" type="number" step="0.01" defaultValue={account?.maxTotalLoss ?? 900} required className={field} style={fs} placeholder="900" />
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>BEM → %9 toplam</p>
        </div>
      </div>

      {/* Row 5 — Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          {label("Başlangıç Tarihi")}
          <input
            name="startDate"
            type="date"
            defaultValue={account?.startDate ? account.startDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}
            required
            className={field}
            style={fs}
          />
        </div>
        <div>
          {label("Bitiş Tarihi (opsiyonel)")}
          <input
            name="endDate"
            type="date"
            defaultValue={account?.endDate ? account.endDate.toISOString().slice(0, 10) : ""}
            className={field}
            style={fs}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        {label("Notlar")}
        <textarea name="notes" rows={2} defaultValue={account?.notes ?? ""} placeholder="Hesap hakkında notlar…" className={`${field} resize-none`} style={fs} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg text-sm"
          style={{ background: "var(--color-bg-surface)", color: "var(--color-text-secondary)", border: "1px solid var(--color-bg-border)" }}
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          {pending ? "Kaydediliyor…" : account ? "Güncelle" : "Hesap Oluştur"}
        </button>
      </div>
    </form>
  );
}
