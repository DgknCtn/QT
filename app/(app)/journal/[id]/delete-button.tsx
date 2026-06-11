"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteTrade } from "./actions";

export function DeleteTradeButton({ tradeId }: { tradeId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      await deleteTrade(tradeId);
      router.push("/journal");
    });
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Emin misin?</span>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "rgba(239,68,68,0.15)", color: "var(--color-danger)", opacity: pending ? 0.6 : 1 }}
        >
          {pending ? "Siliniyor..." : "Evet, Sil"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "var(--color-bg-surface)", color: "var(--color-text-muted)", border: "1px solid var(--color-bg-border)" }}
        >
          İptal
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
      style={{ color: "var(--color-danger)", border: "1px solid var(--color-bg-border)", background: "var(--color-bg-elevated)" }}
    >
      <Trash2 size={12} /> Sil
    </button>
  );
}
