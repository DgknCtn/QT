import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { saveChapter, deleteChapter, deleteLesson } from "../../../actions";
import { Plus, Trash2 } from "lucide-react";

export default async function AdminCourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") redirect("/mentorship");

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      chapters: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course) notFound();

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/mentorship/admin/courses" className="text-xs" style={{ color: "var(--color-text-muted)" }}>← Kurslar</Link>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{course.title}</h1>
      </div>

      {/* Add chapter */}
      <div className="rounded-xl p-5 border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>Yeni Bölüm Ekle</h2>
        <form action={saveChapter} className="flex gap-2">
          <input type="hidden" name="courseId" value={id} />
          <input name="title" required placeholder="Bölüm başlığı"
            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
          <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium shrink-0"
            style={{ background: "var(--color-accent)", color: "#fff" }}>
            <Plus size={14} /> Ekle
          </button>
        </form>
      </div>

      {/* Chapters & Lessons */}
      <div className="space-y-4">
        {course.chapters.map((chapter) => (
          <div key={chapter.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-bg-border)" }}>
            {/* Chapter header */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ background: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-bg-border)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{chapter.title}</span>
              <div className="flex gap-2">
                <Link href={`/mentorship/admin/courses/${id}/lessons/new?chapterId=${chapter.id}`}
                  className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium"
                  style={{ background: "rgba(99,102,241,0.12)", color: "var(--color-accent)" }}>
                  <Plus size={11} /> Ders Ekle
                </Link>
                <form action={deleteChapter.bind(null, chapter.id, id)}>
                  <button type="submit" className="p-1 rounded text-xs"
                    style={{ color: "#ef4444" }} title="Bölümü Sil">
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
            </div>

            {/* Lessons */}
            <div style={{ background: "var(--color-bg-surface)" }}>
              {chapter.lessons.length === 0 && (
                <p className="px-4 py-3 text-xs" style={{ color: "var(--color-text-muted)" }}>Henüz ders yok.</p>
              )}
              {chapter.lessons.map((lesson, idx) => (
                <div key={lesson.id} className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderTop: idx > 0 ? "1px solid var(--color-bg-border)" : undefined }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>{lesson.order}.</span>
                    <span className="text-sm truncate" style={{ color: lesson.isPublished ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                      {lesson.title}
                    </span>
                    {!lesson.isPublished && (
                      <span className="text-xs px-1.5 py-0.5 rounded shrink-0"
                        style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)" }}>Taslak</span>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/mentorship/admin/courses/${id}/lessons/${lesson.id}`}
                      className="px-2.5 py-1 rounded text-xs"
                      style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)" }}>
                      Düzenle
                    </Link>
                    <form action={deleteLesson.bind(null, lesson.id, id)}>
                      <button type="submit" className="p-1 rounded"
                        style={{ color: "#ef4444" }} title="Dersi Sil">
                        <Trash2 size={13} />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {course.chapters.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>
            Henüz bölüm yok. Yukarıdan ilk bölümü ekle.
          </p>
        )}
      </div>
    </div>
  );
}
