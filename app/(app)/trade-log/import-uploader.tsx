"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, AlertTriangle } from "lucide-react";
import { parseImportFile, commitImport } from "./actions";
import type { ParsedTradeRow } from "./parse-tradovate";

export function ImportUploader() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<ParsedTradeRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [warnings, setWarnings] = useState<string[]>([]);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const text = await file.text();
      const { rows: parsedRows, warnings: w } = await parseImportFile(text);
      setRows(parsedRows);
      setSelected(new Set(parsedRows.map((r) => r.key)));
      setWarnings(w);
      setOpen(true);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function toggle(key: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  async function handleImport() {
    setSaving(true);
    try {
      const chosen = rows.filter((r) => selected.has(r.key));
      const res = await commitImport(chosen);
      setResult(res);
      setOpen(false);
      setRows([]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
        style={{ background: "var(--color-accent)", color: "#fff" }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        Tradovate CSV İçe Aktar
      </button>

      {result && (
        <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
          {result.imported} trade içe aktarıldı{result.skipped > 0 ? `, ${result.skipped} tekrar olduğu için atlandı` : ""}.
        </p>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className="rounded-xl border w-full max-w-3xl max-h-[85vh] overflow-y-auto p-5 space-y-4"
            style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Önizleme — {rows.length} trade bulundu
              </h3>
              <button onClick={() => setOpen(false)} className="text-xs" style={{ color: "var(--color-text-muted)" }}>Kapat</button>
            </div>

            {warnings.length > 0 && (
              <div className="rounded-lg border px-3 py-2 space-y-1" style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.3)" }}>
                {warnings.map((w, i) => (
                  <p key={i} className="text-xs flex items-start gap-1.5" style={{ color: "var(--color-warning)" }}>
                    <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" /> {w}
                  </p>
                ))}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ color: "var(--color-text-muted)" }}>
                    <th className="text-left pb-2 pr-2"></th>
                    <th className="text-left pb-2 pr-3">Tarih</th>
                    <th className="text-left pb-2 pr-3">Sembol</th>
                    <th className="text-left pb-2 pr-3">Yön</th>
                    <th className="text-right pb-2 pr-3">Adet</th>
                    <th className="text-right pb-2 pr-3">Giriş</th>
                    <th className="text-right pb-2 pr-3">Çıkış</th>
                    <th className="text-right pb-2 pr-3">Net P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key} className="border-t" style={{ borderColor: "var(--color-bg-border)" }}>
                      <td className="py-1.5 pr-2">
                        <input type="checkbox" checked={selected.has(r.key)} onChange={() => toggle(r.key)} />
                      </td>
                      <td className="py-1.5 pr-3" style={{ color: "var(--color-text-secondary)" }}>
                        {new Date(r.entryTime).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-1.5 pr-3 font-medium" style={{ color: "var(--color-text-primary)" }}>{r.instrument}</td>
                      <td className="py-1.5 pr-3" style={{ color: r.direction === "LONG" ? "var(--color-long)" : "var(--color-short)" }}>{r.direction}</td>
                      <td className="py-1.5 pr-3 text-right" style={{ color: "var(--color-text-secondary)" }}>{r.quantity}</td>
                      <td className="py-1.5 pr-3 text-right font-mono" style={{ color: "var(--color-text-secondary)" }}>{r.entryPrice}</td>
                      <td className="py-1.5 pr-3 text-right font-mono" style={{ color: "var(--color-text-secondary)" }}>{r.exitPrice}</td>
                      <td className="py-1.5 pr-3 text-right font-mono" style={{ color: r.needsManualPnl ? "var(--color-warning)" : (r.netPnl ?? 0) >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                        {r.needsManualPnl ? "manuel gerekli" : `${(r.netPnl ?? 0) >= 0 ? "+" : ""}$${(r.netPnl ?? 0).toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={8} className="py-4 text-center" style={{ color: "var(--color-text-muted)" }}>Trade bulunamadı</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: "var(--color-text-muted)" }}>
                Vazgeç
              </button>
              <button
                onClick={handleImport}
                disabled={saving || selected.size === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                style={{ background: "var(--color-accent)", color: "#fff" }}
              >
                {saving && <Loader2 size={12} className="animate-spin" />}
                {selected.size} trade&apos;i İçe Aktar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
