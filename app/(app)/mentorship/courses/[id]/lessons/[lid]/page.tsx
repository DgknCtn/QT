import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { markLessonComplete, unmarkLessonComplete } from "../../../../actions";
import { CheckCircle2, FileText, Video, ExternalLink } from "lucide-react";

export default async function LessonViewerPage({ params }: { params: Promise<{ id: string; lid: string }> }) {
  const { id, lid } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, include: { menteeProfile: true } });
  const isAdmin = dbUser?.role === "ADMIN";
  if (!isAdmin && (!dbUser?.menteeProfile || dbUser.menteeProfile.status !== "ACTIVE")) redirect("/mentorship");

  const lesson = await prisma.lesson.findUnique({
    where: { id: lid },
    include: {
      chapter: { include: { course: true } },
      progress: { where: { userId: user.id } },
    },
  });
  if (!lesson || !lesson.isPublished) notFound();
  if (lesson.chapter.courseId !== id) notFound();

  const isDone = lesson.progress.length > 0;

  // Next/prev lesson navigation
  const allLessons = await prisma.lesson.findMany({
    where: { chapter: { courseId: id }, isPublished: true },
    orderBy: [{ chapter: { order: "asc" } }, { order: "asc" }],
    select: { id: true, title: true },
  });
  const currentIdx = allLessons.findIndex(l => l.id === lid);
  const prev = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const next = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  // Extract YouTube embed URL
  function toEmbedUrl(url: string | null): string | null {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
  }

  const embedUrl = toEmbedUrl(lesson.videoUrl);

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: "var(--color-text-muted)" }}>
        <Link href="/mentorship" className="hover:underline">Mentorship</Link>
        <span>/</span>
        <Link href={`/mentorship/courses/${id}`} className="hover:underline">{lesson.chapter.course.title}</Link>
        <span>/</span>
        <span style={{ color: "var(--color-text-secondary)" }}>{lesson.chapter.title}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{lesson.title}</h1>
        {isDone && (
          <span className="flex items-center gap-1 text-xs font-medium shrink-0" style={{ color: "#34c97e" }}>
            <CheckCircle2 size={14} /> Tamamlandı
          </span>
        )}
      </div>

      {/* Video embed */}
      {embedUrl && (
        <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16/9", background: "#000" }}>
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Document link */}
      {lesson.documentUrl && (
        <a href={lesson.documentUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-lg p-3.5 border hover:border-[var(--color-accent)] transition-colors"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <FileText size={16} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
          <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Dokümanı Görüntüle</span>
          <ExternalLink size={12} style={{ color: "var(--color-text-muted)", marginLeft: "auto" }} />
        </a>
      )}

      {/* Text content */}
      {lesson.content && (
        <div className="rounded-xl p-5 border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
            <FileText size={14} style={{ color: "var(--color-accent)" }} /> Notlar
          </h2>
          <div className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
            {lesson.content}
          </div>
        </div>
      )}

      {/* Complete / Uncomplete */}
      <div className="flex items-center gap-3">
        {!isDone ? (
          <form action={markLessonComplete.bind(null, lid)}>
            <button type="submit"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: "rgba(52,201,126,0.15)", color: "#34c97e" }}>
              <CheckCircle2 size={15} /> Tamamlandı Olarak İşaretle
            </button>
          </form>
        ) : (
          <form action={unmarkLessonComplete.bind(null, lid)}>
            <button type="submit"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-muted)", border: "1px solid var(--color-bg-border)" }}>
              <CheckCircle2 size={15} /> İşareti Kaldır
            </button>
          </form>
        )}
      </div>

      {/* Prev / Next navigation */}
      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--color-bg-border)" }}>
        {prev ? (
          <Link href={`/mentorship/courses/${id}/lessons/${prev.id}`}
            className="text-sm hover:underline" style={{ color: "var(--color-accent)" }}>
            ← {prev.title}
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/mentorship/courses/${id}/lessons/${next.id}`}
            className="text-sm hover:underline" style={{ color: "var(--color-accent)" }}>
            {next.title} →
          </Link>
        ) : (
          <Link href={`/mentorship/courses/${id}`}
            className="text-sm hover:underline" style={{ color: "var(--color-accent)" }}>
            Kursa Dön →
          </Link>
        )}
      </div>
    </div>
  );
}
