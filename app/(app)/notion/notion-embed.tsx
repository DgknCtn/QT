"use client";

import { ExternalLink } from "lucide-react";
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
  const grouped: Record<string, Page[]> = {};
  for (const p of pages) {
    const cat = p.category || "Genel";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }

  return (
    <div>
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="mb-8">
          <h2 className="text-xs font-semibold mb-3 uppercase tracking-wide"
            style={{ color: "var(--color-text-muted)" }}>
            {cat}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((page) => (
              <div key={page.id} className="relative group rounded-xl border transition-colors hover:border-[var(--color-accent)]"
                style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>

                <a href={page.url} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col gap-3 p-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {page.emoji
                      ? <span className="text-2xl shrink-0">{page.emoji}</span>
                      : <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-sm font-bold"
                          style={{ background: "var(--color-bg-surface)", color: "var(--color-accent)" }}>
                          N
                        </div>
                    }
                    <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                      {page.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ExternalLink size={11} style={{ color: "var(--color-text-muted)" }} />
                    <span className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                      notion.site
                    </span>
                  </div>
                </a>

                {isAdmin && (
                  <form action={deleteNotionPage.bind(null, page.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="submit" className="text-xs px-2 py-1 rounded"
                      style={{ color: "#ef4444", background: "rgba(239,68,68,0.12)" }}>
                      Sil
                    </button>
                  </form>
                )}
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
    </div>
  );
}
