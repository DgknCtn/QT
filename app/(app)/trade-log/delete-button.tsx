"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteBrokerTrade } from "./actions";

export function DeleteBrokerTradeButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Bu trade silinsin mi?")) return;
        startTransition(() => deleteBrokerTrade(id));
      }}
      className="p-1 rounded transition-colors hover:text-red-500 disabled:opacity-50"
      style={{ color: "var(--color-text-muted)" }}
      title="Sil"
    >
      <Trash2 size={12} />
    </button>
  );
}
