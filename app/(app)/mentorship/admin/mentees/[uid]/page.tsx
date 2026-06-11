import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

export default async function MenteeDetailPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") redirect("/mentorship");

  const mentee = await prisma.user.findUnique({
    where: { id: uid },
    include: {
      menteeProfile: true,
    },
  });
  if (!mentee || !mentee.menteeProfile) notFound();

  // All published courses with lessons + this mentee's progress
  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    include: {
      chapters: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
            include: {
              progress: { where: { userId: uid } },
            },
          },
        },
      },
    },
  });

  const totalLessons = courses.reduce((a, c) => a + c.chapters.reduce((b, ch) => b + ch.lessons.length, 0), 0);
  const doneLessons  = courses.reduce((a, c) => a + c.chapters.reduce((b, ch) => b + ch.lessons.filter(l => l.progress.length > 0).length, 0), 0);
  const overallPct   = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

  const approvedAt = mentee.menteeProfile.approvedAt
    ? new Date(mentee.menteeProfile.approvedAt).toLocaleDateString("tr-TR")
    : "—";

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/mentorship/admin/mentees" className="text-xs" style={{ color: "var(--color-text-muted)" }}>← Mentee'ler</Link>
        <h1 className="text-xl font-bold truncate" style={{ color: "var(--color-text-primary)" }}>{mentee.email}</h1>
      </div>

      {/* Overall progress card */}
      <div className="rounded-xl p-5 border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Genel İlerleme</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Onay tarihi: {approvedAt}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: overallPct === 100 ? "#34c97e" : "var(--color-accent)" }}>%{overallPct}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{doneLessons}/{totalLessons} ders</p>
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${overallPct}%`, background: overallPct === 100 ? "#34c97e" : "var(--color-accent)" }} />
        </div>
      </div>

      {/* Per-course breakdown */}
      <div className="space-y-4">
        {courses.map((course) => {
          const cTotal = course.chapters.reduce((a, ch) => a + ch.lessons.length, 0);
          const cDone  = course.chapters.reduce((a, ch) => a + ch.lessons.filter(l => l.progress.length > 0).length, 0);
          const cPct   = cTotal > 0 ? Math.round((cDone / cTotal) * 100) : 0;

          return (
            <div key={course.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-bg-border)" }}>
              {/* Course header */}
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ background: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-bg-border)" }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{course.title}</span>
                  {!course.isPublished && (
                    <span className="text-xs px-1.5 py-0.5 rounded shrink-0"
                      style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)" }}>Taslak</span>
                  )}
                </div>
                <div className="flex items-center gap-2.5 shrink-0 ml-4">
                  <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
                    <div className="h-full rounded-full" style={{ width: `${cPct}%`, background: cPct === 100 ? "#34c97e" : "var(--color-accent)" }} />
                  </div>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{cDone}/{cTotal}</span>
                </div>
              </div>

              {/* Chapters & Lessons */}
              <div style={{ background: "var(--color-bg-surface)" }}>
                {course.chapters.map((chapter) => (
                  <div key={chapter.id}>
                    {/* Chapter label */}
                    <div className="px-4 py-2 border-t" style={{ borderColor: "var(--color-bg-border)", background: "rgba(0,0,0,0.04)" }}>
                      <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{chapter.title}</span>
                    </div>
                    {chapter.lessons.length === 0 ? (
                      <p className="px-6 py-2 text-xs" style={{ color: "var(--color-text-muted)" }}>Ders yok.</p>
                    ) : (
                      chapter.lessons.map((lesson, idx) => {
                        const done = lesson.progress.length > 0;
                        const completedAt = done
                          ? new Date(lesson.progress[0].completedAt).toLocaleDateString("tr-TR")
                          : null;
                        return (
                          <div key={lesson.id}
                            className="flex items-center gap-3 px-4 py-2.5"
                            style={{ borderTop: idx > 0 ? "1px solid var(--color-bg-border)" : undefined }}>
                            {done
                              ? <CheckCircle2 size={14} style={{ color: "#34c97e", flexShrink: 0 }} />
                              : <Circle      size={14} style={{ color: "var(--color-bg-border)", flexShrink: 0 }} />}
                            <span className="flex-1 text-sm" style={{ color: done ? "var(--color-text-secondary)" : "var(--color-text-muted)" }}>
                              {lesson.title}
                            </span>
                            {completedAt && (
                              <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>{completedAt}</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
