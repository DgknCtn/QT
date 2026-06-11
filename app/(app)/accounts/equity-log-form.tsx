"use client";

import { useRef, useTransition } from "react";
import { logEquity } from "./actions";

export function EquityLogForm({ accountId, currentEquity }: { accountId: string; currentEquity: number }) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData(formRef.current!);
    startTransition(async () => {
      await logEquity(accountId, form);
      formRef.current?.reset();
    });
  }

  const field = "rounded-lg border px-3 py-2 text-sm w-full focus:outline-none";
  const fs = { background: "var(--color-bg-surface)", borderColor: "var(--color-bg-border)", color: "var(--color-text-primary)" };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1">
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Güncel Equity ($)</label>
        <input name="equity" type="number" step="0.01" defaultValue={currentEquity} required className={field} style={fs} />
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Bugünkü P&L ($)</label>
        <input name="pnlToday" type="number" step="0.01" placeholder="120 veya -80" className={field} style={fs} />
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Not</label>
        <input name="note" type="text" placeholder="opsiyonel" className={field} style={fs} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap"
        style={{ background: "var(--color-accent)", color: "#fff" }}
      >
        {pending ? "…" : "Kaydet"}
      </button>
    </form>
  );
}
