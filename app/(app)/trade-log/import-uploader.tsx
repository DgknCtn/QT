"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, AlertTriangle } from "lucide-react";
import { parseImportFile, commitImport } from "./actions";
import { guessUtcOffsetFromFilename } from "@/lib/broker/utc-offset";
import type { ParsedTradeRow } from "@/lib/broker/parsed-row";
import { BROKER_SOURCES, type BrokerSource } from "@/lib/broker/sources";
import { formatUsd } from "@/lib/money";

/** Kripto export'larının saatleri offset taşımaz; kullanıcı seçebilmeli. */
const UTC_OFFSETS = [-8, -5, -4, 0, 1, 2, 3, 4, 5, 7, 8, 9];

function offsetLabel(o: number) {
  return `UTC${o >= 0 ? "+" : ""}${o}`;
}

export function ImportUploader({
  source = "TRADOVATE",
  label,
}: {
  source?: BrokerSource;
  label?: string;
}) {
  const info = BROKER_SOURCES[source];
  const buttonLabel = label ?? info.importLabel;
  // Vadeli export'ları saat dilimi taşır; kripto olanlar taşımaz.
  const needsTz = source !== "TRADOVATE";

  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<ParsedTradeRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [warnings, setWarnings] = useState<string[]>([]);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  // Yüklenen dosyayı elde tutuyoruz: kullanıcı saat dilimini değiştirdiğinde
  // dosyayı yeniden seçmek zorunda kalmadan yeniden ayrıştırabilelim.
  const [pending, setPending] = useState<{ text: string; name: string } | null>(null);
  const [utcOffset, setUtcOffset] = useState<number | null>(null);
  // Saat diliminin nereden geldiği: dosyanın içi (OKX), dosya adı (Binance)
  // ya da kullanıcının kendi seçimi. Yanlış offset tüm çeyrek analizini
  // kaydırdığı için bunu açıkça söylemek gerekiyor.
  const [offsetOrigin, setOffsetOrigin] = useState<"file" | "filename" | "manual" | null>(null);

  async function runParse(text: string, offset: number | undefined) {
    setLoading(true);
    try {
      const res = await parseImportFile(text, source, offset);
      setRows(res.rows);
      setSelected(new Set(res.rows.map((r) => r.key)));
      setWarnings(res.warnings);
      // OKX saat dilimini export'un içine yazar: tahmin değil, tespit.
      if (offset === undefined && res.meta?.utcOffset != null) {
        setUtcOffset(res.meta.utcOffset);
        setOffsetOrigin("file");
      }
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    const text = await file.text();

    // Binance offset'i yalnızca dosya adına yazıyor ("...(UTC+3)-part1.csv").
    // OKX ise dosyanın içine yazıyor, orada tahmine gerek yok.
    const guess = source === "BINANCE_FUTURES" ? guessUtcOffsetFromFilename(file.name) : null;
    setUtcOffset(guess);
    setOffsetOrigin(guess !== null ? "filename" : null);
    setPending({ text, name: file.name });

    await runParse(text, guess ?? undefined);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleOffsetChange(next: number) {
    setUtcOffset(next);
    setOffsetOrigin("manual");
    if (pending) await runParse(pending.text, next);
  }

  function toggle(key: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function close() {
    setOpen(false);
    setPending(null);
  }

  async function handleImport() {
    setSaving(true);
    try {
      const chosen = rows.filter((r) => selected.has(r.key));
      const res = await commitImport(chosen);
      setResult(res);
      close();
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
        {buttonLabel}
      </button>

      {result && (
        <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
          {result.imported} trade içe aktarıldı{result.skipped > 0 ? `, ${result.skipped} tekrar olduğu için atlandı` : ""}.
        </p>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className="rounded-xl border w-full max-w-4xl max-h-[85vh] overflow-y-auto p-5 space-y-4"
            style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Önizleme — {rows.length} pozisyon bulundu
              </h3>
              <button onClick={close} className="text-xs" style={{ color: "var(--color-text-muted)" }}>Kapat</button>
            </div>

            {needsTz && (
              <div
                className="rounded-lg border px-3 py-2 flex flex-wrap items-center gap-2"
                style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-bg-border)" }}
              >
                <label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Dosyanın saat dilimi
                </label>
                <select
                  value={utcOffset ?? 3}
                  onChange={(e) => handleOffsetChange(parseInt(e.target.value, 10))}
                  disabled={loading}
                  className="text-xs rounded-md border px-2 py-1"
                  style={{
                    background: "var(--color-bg-elevated)",
                    borderColor: "var(--color-bg-border)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {UTC_OFFSETS.map((o) => (
                    <option key={o} value={o}>{offsetLabel(o)}</option>
                  ))}
                </select>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {offsetOrigin === "file"
                    ? "dosyanın içinden okundu"
                    : offsetOrigin === "filename"
                      ? "dosya adından okundu — yanlışsa değiştirin"
                      : "seans ve çeyrek buna göre hesaplanır"}
                </span>
                {loading && <Loader2 size={12} className="animate-spin" style={{ color: "var(--color-text-muted)" }} />}
              </div>
            )}

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
                    {needsTz && <th className="text-left pb-2 pr-3">Seans</th>}
                    <th className="text-right pb-2 pr-3">{info.quantityLabel}</th>
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
                      {needsTz && (
                        <td className="py-1.5 pr-3" style={{ color: "var(--color-text-muted)" }}>
                          {r.session ? `${r.session.replace("_", " ")} · ${r.quarter90}` : "—"}
                        </td>
                      )}
                      <td className="py-1.5 pr-3 text-right font-mono" style={{ color: "var(--color-text-secondary)" }}>{r.quantity}</td>
                      <td className="py-1.5 pr-3 text-right font-mono" style={{ color: "var(--color-text-secondary)" }}>{r.entryPrice}</td>
                      <td className="py-1.5 pr-3 text-right font-mono" style={{ color: "var(--color-text-secondary)" }}>{r.exitPrice}</td>
                      <td className="py-1.5 pr-3 text-right font-mono" style={{ color: r.needsManualPnl ? "var(--color-warning)" : (r.netPnl ?? 0) >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                        {r.needsManualPnl ? "manuel gerekli" : formatUsd(r.netPnl, { signed: true })}
                        {/* "Sonuc kesin" ile "sonuc yaklasik" ayri seyler:
                            donusturulemeyen komisyon veya eksik funding varsa
                            kullanici bunu rakamin yaninda gormeli. */}
                        {r.costDataIncomplete && !r.needsManualPnl && (
                          <span
                            className="ml-1 cursor-help"
                            style={{ color: "var(--color-warning)" }}
                            title={
                              r.uncountedFees && Object.keys(r.uncountedFees).length > 0
                                ? `Eksik maliyet verisi: ${Object.entries(r.uncountedFees)
                                    .map(([a, v]) => `${v} ${a}`)
                                    .join(", ")} komisyonu kur bilgisi olmadığı için düşülmedi.`
                                : "Eksik maliyet verisi: funding bu export'ta yok."
                            }
                          >
                            ~
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={needsTz ? 9 : 8} className="py-4 text-center" style={{ color: "var(--color-text-muted)" }}>Pozisyon bulunamadı</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={close} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: "var(--color-text-muted)" }}>
                Vazgeç
              </button>
              <button
                onClick={handleImport}
                disabled={saving || selected.size === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                style={{ background: "var(--color-accent)", color: "#fff" }}
              >
                {saving && <Loader2 size={12} className="animate-spin" />}
                {selected.size} pozisyonu İçe Aktar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
