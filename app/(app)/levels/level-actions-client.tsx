"use client";

import { useTransition } from "react";
import { deleteLevel, toggleLevelStatus } from "./actions";
import type { LevelStatus } from "@prisma/client";

export function DeleteLevelButton({ levelId }: { levelId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("Bu level silinsin mi?")) return;
        startTransition(() => deleteLevel(levelId));
      }}
      className="px-2 py-1 rounded text-xs disabled:opacity-50"
      style={{ background: "var(--color-bg-surface)", color: "#ef4444", border: "1px solid var(--color-bg-border)" }}
    >
      {pending ? "…" : "Sil"}
    </button>
  );
}

export function ToggleStatusButton({ levelId, status }: { levelId: string; status: LevelStatus }) {
  const [pending, startTransition] = useTransition();
  const label = status === "ACTIVE" ? "Devre Dışı" : "Aktifleştir";
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => toggleLevelStatus(levelId, status))}
      className="px-2 py-1 rounded text-xs disabled:opacity-50"
      style={{ background: "var(--color-bg-surface)", color: "var(--color-text-muted)", border: "1px solid var(--color-bg-border)" }}
    >
      {pending ? "…" : label}
    </button>
  );
}
