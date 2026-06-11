"use client";

import { useState, useRef } from "react";
import { X, ExternalLink, AlertCircle } from "lucide-react";
import { deleteNotionPage } from "./actions";

type Page = {
  id: string;
  title: string;
  url: string;
  category: string | null;
  emoji: string | null;
};

interface Props {
  pages: Page[];
  isAdmin: boolean;
}

export function NotionHub({ pages, isAdmin }: Props) {
  const [selected, setSelected] = useState<Page | null>(null);
  const [blocked, setBlocked]   = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function open(page: Page) {
    setSelected(page);
    setBlocked(false);
  }

  function close() {
    setSelected(null);
    setBlocked(false);
  }

  // Group by category
  const grouped: Record<string, Page[]> = {};
  for (const p of pages) {
    const cat = p.category || "Genel";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }

  return (
    <div>
      {/* Card grid */}
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="mb-8">
          <h2 className="text-xs font-semibold mb-3 uppercase tracking-wide"
            style={{ color: "var(--color-text-muted)" }}>
            {cat}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((page) => (
              <div key={page.id}
                className="rounded-xl p-4 border flex flex-col gap-2 cursor-pointer hover:border-[var(--color-accent)] transition-colors"
                style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
                onClick={() => open(page)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {page.emoji && <span className="text-xl shrink-0">{page.emoji}</span>}
                    <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                      {page.title}
                    </span>
                  </div>
                  {isAdmin && (
                    <form onSubmit={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}>
                      <button
                        formAction={async () => { await deleteNotionPage(page.id); }}
                        className="text-xs px-2 py-1 rounded shrink-0"
                        style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }}>
                        Sil
                      </button>
                    </form>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-auto">
                  <ExternalLink size={11} style={{ color: "var(--color-text-muted)" }} />
                  <span className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                    {page.url.replace(/^https?:\/\//, "").slice(0, 40)}…
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {pages.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Henüz sayfa eklenmemiş.
        </p>
      )}

      {/* Embed modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--color-bg-base)" }}>
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 h-12 shrink-0 border-b"
            style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
            <button onClick={close} className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--color-text-muted)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-surface)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <X size={16} />
            </button>
            {selected.emoji && <span>{selected.emoji}</span>}
            <span className="text-sm font-semibold flex-1 truncate" style={{ color: "var(--color-text-primary)" }}>
              {selected.title}
            </span>
            <a href={selected.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0"
              style={{ background: "var(--color-bg-surface)", color: "var(--color-text-secondary)", border: "1px solid var(--color-bg-border)" }}>
              <ExternalLink size={12} /> Notion'da Aç
            </a>
          </div>

          {/* iframe or blocked state */}
          {blocked ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <AlertCircle size={32} style={{ color: "var(--color-text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Bu sayfa gömülü görüntülenemiyor.
              </p>
              <a href={selected.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: "var(--color-accent)", color: "#fff" }}>
                <ExternalLink size={14} /> Notion'da Aç
              </a>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={selected.url}
              className="flex-1 w-full border-0"
              onError={() => setBlocked(true)}
              onLoad={(e) => {
                // Detect X-Frame-Options block: contentDocument will be null or throw
                try {
                  const doc = (e.target as HTMLIFrameElement).contentDocument;
                  if (!doc) setBlocked(true);
                } catch {
                  setBlocked(true);
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
