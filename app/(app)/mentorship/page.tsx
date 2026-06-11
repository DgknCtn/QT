import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { requestMenteeAccess } from "./actions";
import { BookOpen, FileText, Video, Link2, Image as ImgIcon, ChevronRight, Clock, CheckCircle2 } from "lucide-react";

export default async function MentorshipPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const dbUser = user
    ? await prisma.user.findUnique({ where: { id: user.id }, include: { menteeProfile: true } })
    : null;

  // Admin: redirect to admin panel
  if (dbUser?.role === "ADMIN") {
    return (
      <div className="p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Mentorship</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Mentor paneli</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/mentorship/admin/mentees" className="rounded-xl p-5 border flex flex-col gap-2 hover:border-[var(--color-accent)] transition-colors"
            style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Mentee'ler</span>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Onay bekleyenler ve aktif mentee'ler</span>
          </Link>
          <Link href="/mentorship/admin/courses" className="rounded-xl p-5 border flex flex-col gap-2 hover:border-[var(--color-accent)] transition-colors"
            style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Kurslar</span>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Kurs ve ders yönetimi</span>
          </Link>
          <Link href="/mentorship/admin/resources" className="rounded-xl p-5 border flex flex-col gap-2 hover:border-[var(--color-accent)] transition-colors"
            style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Kaynaklar</span>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Kaynak kütüphanesi yönetimi</span>
          </Link>
        </div>
        <div className="mt-8">
          <Link href="/mentorship/admin" className="text-sm font-medium" style={{ color: "var(--color-accent)" }}>
            Admin Paneline Git →
          </Link>
        </div>
      </div>
    );
  }

  // Not logged in or no profile → request access
  if (!dbUser?.menteeProfile) {
    return (
      <div className="p-6 max-w-lg">
        <div className="rounded-xl p-8 border text-center" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <BookOpen size={36} className="mx-auto mb-4" style={{ color: "var(--color-accent)" }} />
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Mentorship Programı</h2>
          <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
            Trading eğitim içeriklerine erişmek için mentor onayı gerekiyor. Talep gönderdikten sonra mentor inceleyip onaylayacak.
          </p>
          <form action={requestMenteeAccess}>
            <button type="submit"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity"
              style={{ background: "var(--color-accent)", color: "#fff" }}>
              Erişim Talep Et
            </button>
          </form>
        </div>
      </div>
    );
  }

  const profile = dbUser.menteeProfile;

  // Pending
  if (profile.status === "PENDING") {
    return (
      <div className="p-6 max-w-lg">
        <div className="rounded-xl p-8 border text-center" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <Clock size={36} className="mx-auto mb-4" style={{ color: "#f59e0b" }} />
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Onay Bekleniyor</h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Erişim talebiniz mentor tarafından inceleniyor. Onaylandıktan sonra içeriklere erişebileceksiniz.
          </p>
        </div>
      </div>
    );
  }

  // Rejected
  if (profile.status === "REJECTED") {
    return (
      <div className="p-6 max-w-lg">
        <div className="rounded-xl p-8 border text-center" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>Talep Reddedildi</h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Mentor erişim talebinizi şu an için onaylamadı.
          </p>
        </div>
      </div>
    );
  }

  // ACTIVE mentee: show courses + resources
  const [courses, resources] = await Promise.all([
    prisma.course.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      include: {
        chapters: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              where: { isPublished: true },
              orderBy: { order: "asc" },
              include: { progress: { where: { userId: user!.id } } },
            },
          },
        },
      },
    }),
    prisma.resource.findMany({ orderBy: { order: "asc" }, take: 6 }),
  ]);

  const resourceIcon = (type: string) => {
    switch (type) {
      case "VIDEO":    return <Video size={14} />;
      case "DOCUMENT": return <FileText size={14} />;
      case "IMAGE":    return <ImgIcon size={14} />;
      default:         return <Link2 size={14} />;
    }
  };

  return (
    <div className="p-6 max-w-4xl space-y-8">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Mentorship</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Eğitim içerikleri ve kaynaklar</p>
      </div>

      {/* Courses */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-secondary)" }}>KURSLAR</h2>
        {courses.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Henüz yayınlanmış kurs yok.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courses.map((course) => {
              const totalLessons = course.chapters.reduce((a, c) => a + c.lessons.length, 0);
              const doneLessons  = course.chapters.reduce((a, c) => a + c.lessons.filter(l => l.progress.length > 0).length, 0);
              const pct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
              return (
                <Link key={course.id} href={`/mentorship/courses/${course.id}`}
                  className="rounded-xl p-5 border flex flex-col gap-3 hover:border-[var(--color-accent)] transition-colors"
                  style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{course.title}</span>
                    <ChevronRight size={14} style={{ color: "var(--color-text-muted)", flexShrink: 0, marginTop: 2 }} />
                  </div>
                  {course.description && (
                    <p className="text-xs line-clamp-2" style={{ color: "var(--color-text-muted)" }}>{course.description}</p>
                  )}
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{doneLessons}/{totalLessons} ders</span>
                      <span className="text-xs font-medium" style={{ color: pct === 100 ? "#34c97e" : "var(--color-text-secondary)" }}>
                        {pct === 100 ? <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Tamamlandı</span> : `%${pct}`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? "#34c97e" : "var(--color-accent)" }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick resources */}
      {resources.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>KAYNAKLAR</h2>
            <Link href="/mentorship/resources" className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>Tümünü Gör →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {resources.map((r) => (
              <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                className="rounded-lg p-3.5 border flex items-start gap-2.5 hover:border-[var(--color-accent)] transition-colors"
                style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
                <span style={{ color: "var(--color-accent)", marginTop: 1 }}>{resourceIcon(r.type)}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{r.title}</p>
                  {r.category && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{r.category}</p>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
