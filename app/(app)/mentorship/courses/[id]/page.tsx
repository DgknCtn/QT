import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";

export default async function MenteeCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, include: { menteeProfile: true } });
  if (!dbUser?.menteeProfile || dbUser.menteeProfile.status !== "ACTIVE") redirect("/mentorship");

  const course = await prisma.course.findUnique({
    where: { id, isPublished: true },
    include: {
      chapters: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
            include: { progress: { where: { userId: user.id } } },
          },
        },
      },
    },
  });
  if (!course) notFound();

  const totalLessons = course.chapters.reduce((a, c) => a + c.lessons.length, 0);
  const doneLessons  = course.chapters.reduce((a, c) => a + c.lessons.filter(l => l.progress.length > 0).length, 0);
  const pct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/mentorship" className="text-xs" style={{ color: "var(--color-text-muted)" }}>← Mentorship</Link>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{course.title}</h1>
      </div>

      {course.description && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{course.description}</p>
      )}

      {/* Progress bar */}
      <div className="rounded-xl p-4 border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>İlerleme</span>
          <span className="text-sm font-semibold" style={{ color: pct === 100 ? "#34c97e" : "var(--color-accent)" }}>
            {pct}% · {doneLessons}/{totalLessons} ders
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? "#34c97e" : "var(--color-accent)" }} />
        </div>
      </div>

      {/* Chapters */}
      <div className="space-y-4">
        {course.chapters.map((chapter) => (
          <div key={chapter.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-bg-border)" }}>
            <div className="px-4 py-3" style={{ background: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-bg-border)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{chapter.title}</span>
              {chapter.description && (
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{chapter.description}</p>
              )}
            </div>
            <div style={{ background: "var(--color-bg-surface)" }}>
              {chapter.lessons.length === 0 && (
                <p className="px-4 py-3 text-xs" style={{ color: "var(--color-text-muted)" }}>Henüz ders yok.</p>
              )}
              {chapter.lessons.map((lesson, idx) => {
                const done = lesson.progress.length > 0;
                return (
                  <Link key={lesson.id}
                    href={`/mentorship/courses/${id}/lessons/${lesson.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-hover)] transition-colors"
                    style={{ borderTop: idx > 0 ? "1px solid var(--color-bg-border)" : undefined }}>
                    {done
                      ? <CheckCircle2 size={16} style={{ color: "#34c97e", flexShrink: 0 }} />
                      : <Circle      size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />}
                    <span className="flex-1 text-sm" style={{ color: done ? "var(--color-text-secondary)" : "var(--color-text-primary)" }}>
                      {lesson.title}
                    </span>
                    <ChevronRight size={14} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
