import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Video, FileText, Link2, Image as ImgIcon } from "lucide-react";

export default async function MenteeResourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, include: { menteeProfile: true } });
  if (!dbUser?.menteeProfile || dbUser.menteeProfile.status !== "ACTIVE") redirect("/mentorship");

  const resources = await prisma.resource.findMany({ orderBy: { order: "asc" } });

  // Group by category
  const grouped: Record<string, typeof resources> = {};
  for (const r of resources) {
    const cat = r.category ?? "Genel";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(r);
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case "VIDEO":    return <Video    size={15} />;
      case "DOCUMENT": return <FileText size={15} />;
      case "IMAGE":    return <ImgIcon  size={15} />;
      default:         return <Link2   size={15} />;
    }
  };

  const typeLabel: Record<string, string> = {
    VIDEO: "Video", DOCUMENT: "Doküman", LINK: "Link", IMAGE: "Görsel",
  };

  return (
    <div className="p-6 max-w-4xl space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/mentorship" className="text-xs" style={{ color: "var(--color-text-muted)" }}>← Mentorship</Link>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Kaynak Kütüphanesi</h1>
      </div>

      {resources.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Henüz kaynak eklenmemiş.</p>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
              {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((r) => (
                <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                  className="rounded-xl p-4 border flex flex-col gap-2 hover:border-[var(--color-accent)] transition-colors"
                  style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: "var(--color-accent)" }}>{typeIcon(r.type)}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: "var(--color-bg-surface)", color: "var(--color-text-muted)" }}>
                      {typeLabel[r.type] ?? r.type}
                    </span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{r.title}</p>
                  {r.description && (
                    <p className="text-xs line-clamp-2" style={{ color: "var(--color-text-muted)" }}>{r.description}</p>
                  )}
                </a>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
