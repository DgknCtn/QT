"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const ROUTES: { label: string; href: string; keywords?: string }[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Daily Prep", href: "/daily-prep", keywords: "prep hazırlık" },
  { label: "Yeni Daily Prep", href: "/daily-prep/new", keywords: "new prep" },
  { label: "Journal", href: "/journal", keywords: "trade işlem" },
  { label: "Yeni Trade", href: "/journal/new", keywords: "add trade işlem ekle" },
  { label: "Trade Log", href: "/trade-log", keywords: "broker csv import" },
  { label: "Analytics", href: "/analytics", keywords: "istatistik" },
  { label: "Calendar", href: "/calendar", keywords: "takvim haber news" },
  { label: "Accounts", href: "/accounts", keywords: "hesap funded goals hedef" },
  { label: "Levels", href: "/levels", keywords: "seviye" },
  { label: "Setups", href: "/setups" },
  { label: "Playbook", href: "/playbook" },
  { label: "Knowledge Base", href: "/knowledge", keywords: "konsept concept bilgi" },
  { label: "Education", href: "/katmanlar", keywords: "katmanlar eğitim" },
  { label: "Weekly Review", href: "/weekly-review", keywords: "haftalık" },
  { label: "Risk Calculator", href: "/risk-calculator", keywords: "risk hesap" },
  { label: "Mentorship", href: "/mentorship", keywords: "kurs course ders" },
  { label: "Settings", href: "/settings", keywords: "ayarlar" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return ROUTES;
    return ROUTES.filter((r) => `${r.label} ${r.keywords ?? ""}`.toLowerCase().includes(term));
  }, [q]);

  function go(href: string) {
    setOpen(false);
    setQ("");
    router.push(href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-app text-xs text-muted hover-surface transition-colors"
        title="Ara (⌘K)"
      >
        <Search size={13} />
        <span className="hidden sm:inline">Ara</span>
        <kbd className="hidden sm:inline text-[10px] px-1 rounded border border-app">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setOpen(false)}>
          <div className="card w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-app">
              <Search size={15} className="text-muted" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Sayfa ara…"
                className="flex-1 bg-transparent outline-none text-sm text-primary"
                onKeyDown={(e) => { if (e.key === "Enter" && results[0]) go(results[0].href); }}
              />
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              {results.map((r) => (
                <button
                  key={r.href}
                  onClick={() => go(r.href)}
                  className="w-full text-left px-3 py-2 text-sm text-secondary hover-surface transition-colors"
                >
                  {r.label}
                </button>
              ))}
              {results.length === 0 && (
                <p className="px-3 py-4 text-xs text-muted text-center">Sonuç yok</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
