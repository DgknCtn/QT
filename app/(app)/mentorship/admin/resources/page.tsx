import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { saveResource, deleteResource } from "../../actions";
import { Trash2, Plus } from "lucide-react";

export default async function AdminResourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") redirect("/mentorship");

  const resources = await prisma.resource.findMany({ orderBy: { order: "asc" } });

  const lessons = await prisma.lesson.findMany({
    orderBy: [{ chapter: { course: { order: "asc" } } }, { chapter: { order: "asc" } }, { order: "asc" }],
    select: { id: true, title: true, chapter: { select: { course: { select: { title: true } } } } },
  });

  const typeLabel: Record<string, string> = {
    VIDEO: "Video", DOCUMENT: "Doküman", LINK: "Link", IMAGE: "Görsel",
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/mentorship/admin" className="text-xs" style={{ color: "var(--color-text-muted)" }}>← Admin</Link>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Kaynak Kütüphanesi</h1>
      </div>

      {/* Add resource */}
      <div className="rounded-xl p-5 border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Yeni Kaynak</h2>
        <form action={saveResource} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="title" required placeholder="Başlık"
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
            <select name="type" required
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }}>
              <option value="VIDEO">Video</option>
              <option value="DOCUMENT">Doküman</option>
              <option value="LINK">Link</option>
              <option value="IMAGE">Görsel</option>
            </select>
          </div>
          <input name="url" type="url" required placeholder="https://..."
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="description" placeholder="Açıklama (isteğe bağlı)"
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
            <input name="category" placeholder="Kategori (ör: Risk, ICT, Psikoloji)"
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
          </div>
          <select name="lessonId"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }}>
            <option value="">Derse bağlı değil (genel kaynak)</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>{l.chapter.course.title} — {l.title}</option>
            ))}
          </select>
          <button type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--color-accent)", color: "#fff" }}>
            <Plus size={14} /> Ekle
          </button>
        </form>
      </div>

      {/* Resource list */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-bg-border)" }}>
        {resources.length === 0 ? (
          <p className="p-4 text-sm" style={{ color: "var(--color-text-muted)" }}>Henüz kaynak yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-bg-border)" }}>
                <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Başlık</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Tür</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Kategori</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {resources.map((r, i) => (
                <tr key={r.id} style={{ borderTop: i > 0 ? "1px solid var(--color-bg-border)" : undefined, background: "var(--color-bg-surface)" }}>
                  <td className="px-4 py-3">
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      className="font-medium hover:underline" style={{ color: "var(--color-text-primary)" }}>
                      {r.title}
                    </a>
                    {r.description && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{r.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded"
                      style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)" }}>
                      {typeLabel[r.type] ?? r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text-muted)" }}>{r.category ?? "—"}</td>
                  <td className="px-4 py-3">
                    <form action={deleteResource.bind(null, r.id)}>
                      <button type="submit" className="p-1 rounded" style={{ color: "#ef4444" }}>
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
