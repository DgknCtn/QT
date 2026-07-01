"use client";

import { useMemo, useState } from "react";
import { Video, FileText, Link2, Image as ImgIcon, Search } from "lucide-react";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string;
  category: string | null;
};

const typeLabel: Record<string, string> = {
  VIDEO: "Video", DOCUMENT: "Doküman", LINK: "Link", IMAGE: "Görsel",
};

function typeIcon(type: string) {
  switch (type) {
    case "VIDEO":    return <Video size={15} />;
    case "DOCUMENT": return <FileText size={15} />;
    case "IMAGE":    return <ImgIcon size={15} />;
    default:         return <Link2 size={15} />;
  }
}

export function ResourcesBrowser({ resources }: { resources: Resource[] }) {
  const [q, setQ] = useState("");

  const grouped = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = term
      ? resources.filter((r) => `${r.title} ${r.description ?? ""} ${r.category ?? ""}`.toLowerCase().includes(term))
      : resources;
    const g: Record<string, Resource[]> = {};
    for (const r of filtered) {
      const cat = r.category ?? "Genel";
      (g[cat] ??= []).push(r);
    }
    return g;
  }, [q, resources]);

  const entries = Object.entries(grouped);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-app bg-surface max-w-sm">
        <Search size={14} className="text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Kaynak ara…"
          className="flex-1 bg-transparent outline-none text-sm text-primary"
        />
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted">Sonuç bulunamadı.</p>
      ) : (
        entries.map(([category, items]) => (
          <div key={category}>
            <h2 className="text-xs font-semibold mb-3 uppercase tracking-wide text-muted">{category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((r) => (
                <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                  className="card p-4 flex flex-col gap-2 hover:border-[var(--color-accent)] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-accent">{typeIcon(r.type)}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-surface text-muted">{typeLabel[r.type] ?? r.type}</span>
                  </div>
                  <p className="text-sm font-semibold text-primary">{r.title}</p>
                  {r.description && <p className="text-xs line-clamp-2 text-muted">{r.description}</p>}
                </a>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
