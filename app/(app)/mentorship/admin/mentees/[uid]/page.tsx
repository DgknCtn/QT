import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import { addMentorNote, deleteMentorNote, approveMentee, rejectMentee } from "../../../actions";
import { format } from "date-fns";

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
      mentorNotes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!mentee || !mentee.menteeProfile) notFound();

  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    include: {
      chapters: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
            include: { progress: { where: { userId: uid } } },
          },
        },
      },
    },
  });

  const totalLessons = courses.reduce((a, c) => a + c.chapters.reduce((b, ch) => b + ch.lessons.length, 0), 0);
  const doneLessons  = courses.reduce((a, c) => a + c.chapters.reduce((b, ch) => b + ch.lessons.filter(l => l.progress.length > 0).length, 0), 0);
  const overallPct   = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

  const profile    = mentee.menteeProfile;
  const approvedAt = profile.approvedAt ? format(new Date(profile.approvedAt), "dd MMM yyyy") : "—";

  const statusColor = profile.status === "ACTIVE" ? "#34c97e" : profile.status === "PENDING" ? "#f59e0b" : "#ef4444";
  const statusLabel = profile.status === "ACTIVE" ? "Aktif" : profile.status === "PENDING" ? "Bekliyor" : "Reddedildi";

  const cardStyle = { background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/mentorship/admin/mentees" className="text-xs mb-2 inline-block" style={{ color: "var(--color-text-muted)" }}>
            ← Mentee'ler
          </Link>
          <h1 className="text-xl font-bold truncate" style={{ color: "var(--color-text-primary)" }}>{mentee.email}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: statusColor, background: `${statusColor}20` }}>
              {statusLabel}
            </span>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Onay: {approvedAt}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 mt-1">
          {profile.status !== "ACTIVE" && (
            <form action={approveMentee.bind(null, uid)}>
              <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "rgba(52,201,126,0.15)", color: "#34c97e" }}>
                Onayla
              </button>
            </form>
          )}
          {profile.status === "ACTIVE" && (
            <form action={rejectMentee.bind(null, uid)}>
              <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                Erişimi Kaldır
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Progress summary */}
      <div className="rounded-xl p-5 border" style={cardStyle}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Kurs İlerlemesi</p>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: overallPct === 100 ? "#34c97e" : "var(--color-accent)" }}>%{overallPct}</p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{doneLessons}/{totalLessons} ders</p>
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${overallPct}%`, background: overallPct === 100 ? "#34c97e" : "var(--color-accent)" }} />
        </div>
      </div>

      {/* Mentor Notes */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-bg-border)" }}>
        <div className="px-5 py-3 border-b flex items-center justify-between"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Mentor Notları
            {mentee.mentorNotes.length > 0 && (
              <span className="ml-2 text-xs font-normal px-1.5 py-0.5 rounded"
                style={{ background: "var(--color-bg-surface)", color: "var(--color-text-muted)" }}>
                {mentee.mentorNotes.length}
              </span>
            )}
          </p>
        </div>

        {/* Add note form */}
        <div className="p-4 border-b" style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-bg-border)" }}>
          <form action={addMentorNote.bind(null, uid)} className="flex gap-2">
            <textarea
              name="content"
              rows={2}
              placeholder="Not ekle… (trade feedback, gözlem, öneri)"
              required
              className="field-input flex-1 resize-none"
              style={{ minHeight: 60 }}
            />
            <button type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium self-end shrink-0"
              style={{ background: "var(--color-accent)", color: "#fff" }}>
              Ekle
            </button>
          </form>
        </div>

        {/* Notes list */}
        {mentee.mentorNotes.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Henüz not eklenmedi.</p>
          </div>
        ) : (
          <div style={{ background: "var(--color-bg-elevated)" }}>
            {mentee.mentorNotes.map((note, idx) => (
              <div key={note.id}
                className="px-5 py-3 flex items-start gap-3"
                style={{ borderTop: idx > 0 ? "1px solid var(--color-bg-border)" : undefined }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text-primary)" }}>{note.content}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                    {format(new Date(note.createdAt), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
                <form action={deleteMentorNote.bind(null, note.id, uid)}>
                  <button type="submit" title="Sil"
                    className="p-1.5 rounded transition-colors shrink-0 mt-0.5"
                    style={{ color: "var(--color-text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}>
                    <Trash2 size={13} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Course breakdown */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Ders Detayı</p>
        {courses.map((course) => {
          const cTotal = course.chapters.reduce((a, ch) => a + ch.lessons.length, 0);
          const cDone  = course.chapters.reduce((a, ch) => a + ch.lessons.filter(l => l.progress.length > 0).length, 0);
          const cPct   = cTotal > 0 ? Math.round((cDone / cTotal) * 100) : 0;

          return (
            <div key={course.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-bg-border)" }}>
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
              <div style={{ background: "var(--color-bg-surface)" }}>
                {course.chapters.map((chapter) => (
                  <div key={chapter.id}>
                    <div className="px-4 py-2 border-t" style={{ borderColor: "var(--color-bg-border)", background: "rgba(0,0,0,0.04)" }}>
                      <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{chapter.title}</span>
                    </div>
                    {chapter.lessons.map((lesson, idx) => {
                      const done        = lesson.progress.length > 0;
                      const completedAt = done ? format(new Date(lesson.progress[0].completedAt), "dd MMM") : null;
                      return (
                        <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5"
                          style={{ borderTop: idx > 0 ? "1px solid var(--color-bg-border)" : undefined }}>
                          {done
                            ? <CheckCircle2 size={14} style={{ color: "#34c97e", flexShrink: 0 }} />
                            : <Circle       size={14} style={{ color: "var(--color-bg-border)", flexShrink: 0 }} />}
                          <span className="flex-1 text-sm" style={{ color: done ? "var(--color-text-secondary)" : "var(--color-text-muted)" }}>
                            {lesson.title}
                          </span>
                          {completedAt && (
                            <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>{completedAt}</span>
                          )}
                        </div>
                      );
                    })}
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
