"use client";

import { Download } from "lucide-react";

type TradeRow = {
  id: string;
  date: Date;
  instrument: string;
  direction: string | null;
  session: string | null;
  setupType: string | null;
  result: string | null;
  entryPrice: number | null;
  stopPrice: number | null;
  tp1: number | null;
  riskPercent: number | null;
  rResult: number | null;
  pnlPoints: number | null;
  pnlCurrency: number | null;
  processGrade: string | null;
  processScore: number | null;
  planFollowed: string | null;
  notes: string | null;
};

export function ExportCsvButton({ trades }: { trades: TradeRow[] }) {
  function handleExport() {
    const headers = [
      "Tarih", "Enstrüman", "Yön", "Seans", "Setup", "Sonuç",
      "Entry", "Stop", "TP1", "Risk%", "R Sonuç", "PnL Puan", "PnL $",
      "Süreç Notu", "Süreç Puanı", "Plan Takip", "Notlar",
    ];

    const rows = trades.map((t) => [
      new Date(t.date).toLocaleDateString("tr-TR"),
      t.instrument,
      t.direction ?? "",
      t.session ?? "",
      t.setupType ?? "",
      t.result ?? "",
      t.entryPrice ?? "",
      t.stopPrice ?? "",
      t.tp1 ?? "",
      t.riskPercent ?? "",
      t.rResult ?? "",
      t.pnlPoints ?? "",
      t.pnlCurrency ?? "",
      t.processGrade ?? "",
      t.processScore ?? "",
      t.planFollowed ?? "",
      (t.notes ?? "").replace(/\n/g, " ").replace(/,/g, ";"),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `qt-journal-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      title={`${trades.length} trade'i CSV olarak indir`}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
      style={{
        borderColor: "var(--color-bg-border)",
        color: "var(--color-text-muted)",
        background: "var(--color-bg-elevated)",
      }}
    >
      <Download size={12} />
      CSV
    </button>
  );
}
