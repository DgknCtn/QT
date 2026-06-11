import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { saveCourse, toggleCoursePublished, deleteCourse } from "../../actions";
import { Plus } from "lucide-react";

export default async function AdminCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") redirect("/mentorship");

  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { chapters: true } } },
  });

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/mentorship/admin" className="text-xs" style={{ color: "var(--color-text-muted)" }}>← Admin</Link>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Kurslar</h1>
      </div>

      {/* New course form */}
      <div className="rounded-xl p-5 border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Yeni Kurs</h2>
        <form action={saveCourse} className="space-y-3">
          <input type="hidden" name="isPublished" value="false" />
          <input name="title" required placeholder="Kurs başlığı"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
          <input name="description" placeholder="Açıklama (isteğe bağlı)"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
          <button type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--color-accent)", color: "#fff" }}>
            <Plus size={14} /> Oluştur
          </button>
        </form>
      </div>

      {/* Course list */}
      <div className="space-y-2">
        {courses.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Henüz kurs yok.</p>
        )}
        {courses.map((c) => (
          <div key={c.id} className="rounded-xl p-4 border flex items-center gap-3"
            style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{c.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {c._count.chapters} bölüm
                {c.description && ` · ${c.description.slice(0, 60)}${c.description.length > 60 ? "…" : ""}`}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-medium shrink-0"
              style={{ color: c.isPublished ? "#34c97e" : "#f59e0b", background: c.isPublished ? "rgba(52,201,126,0.12)" : "rgba(245,158,11,0.12)" }}>
              {c.isPublished ? "Yayında" : "Taslak"}
            </span>
            <div className="flex gap-2 shrink-0">
              <Link href={`/mentorship/admin/courses/${c.id}`}
                className="px-3 py-1 rounded text-xs font-medium"
                style={{ background: "var(--color-bg-surface)", color: "var(--color-text-secondary)" }}>
                Düzenle
              </Link>
              <form action={toggleCoursePublished.bind(null, c.id, c.isPublished)}>
                <button type="submit" className="px-3 py-1 rounded text-xs font-medium"
                  style={{ background: "var(--color-bg-surface)", color: "var(--color-text-secondary)" }}>
                  {c.isPublished ? "Gizle" : "Yayınla"}
                </button>
              </form>
              <form action={deleteCourse.bind(null, c.id)}>
                <button type="submit" className="px-3 py-1 rounded text-xs font-medium"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                  Sil
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
