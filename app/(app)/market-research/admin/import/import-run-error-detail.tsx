"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function ImportRunErrorDetail({
  errorDetail,
}: {
  errorDetail: { file: string; reason: string }[] | null;
}) {
  const [open, setOpen] = useState(false);
  if (!errorDetail || errorDetail.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {errorDetail.length} hata detayı
      </button>
      {open && (
        <div className="mt-1 space-y-1 max-h-48 overflow-y-auto">
          {errorDetail.map((e, i) => (
            <p key={i} className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span style={{ color: "var(--color-danger)" }}>{e.file}</span>: {e.reason}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
