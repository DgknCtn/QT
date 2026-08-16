"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveMyNotes } from "./actions";

/**
 * Per-user notes on a shared concept. Available to every signed-in user --
 * concept *content* is admin-curated, but the notes are personal.
 */
export function MyNotes({ conceptId, initialNotes }: { conceptId: string; initialNotes: string | null }) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saved, setSaved] = useState(initialNotes ?? "");
  const [pending, startTransition] = useTransition();

  const dirty = notes !== saved;

  function handleSave() {
    startTransition(async () => {
      try {
        await saveMyNotes(conceptId, notes);
        setSaved(notes);
        toast.success("Notların kaydedildi");
      } catch {
        toast.error("Notlar kaydedilemedi");
      }
    });
  }

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--color-text-muted)" }}
        >
          Notlarım
        </h3>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={pending}
            className="rounded-lg px-2.5 py-1 text-xs font-medium transition-opacity disabled:opacity-50"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </button>
        )}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        placeholder="Kendi gözlemlerin, örneklerin, uç durumlar…"
        aria-label="Bu kavram için kişisel notlarım"
        className="field-input"
        style={{ resize: "vertical", color: "var(--color-accent)" }}
      />
    </div>
  );
}
