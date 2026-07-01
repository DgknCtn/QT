import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MentorshipAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") redirect("/mentorship");

  const [pendingCount, activeCount, courseCount, resourceCount, totalLessons, activeMentees] = await Promise.all([
    prisma.menteeProfile.count({ where: { status: "PENDING" } }),
    prisma.menteeProfile.count({ where: { status: "ACTIVE" } }),
    prisma.course.count(),
    prisma.resource.count(),
    prisma.lesson.count({ where: { isPublished: true } }),
    prisma.menteeProfile.findMany({
      where: { status: "ACTIVE" },
      select: {
        userId: true,
        user: { select: { email: true } },
        progress: { select: { completedAt: true }, orderBy: { completedAt: "desc" } },
      },
    }),
  ]);

  // Average completion + stalled mentees (no progress in 7+ days)
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const completions = activeMentees.map((m) => ({
    email: m.user.email,
    done: m.progress.length,
    pct: totalLessons > 0 ? Math.round((m.progress.length / totalLessons) * 100) : 0,
    lastActivity: m.progress[0]?.completedAt ?? null,
  }));
  const avgCompletion = completions.length
    ? Math.round(completions.reduce((s, c) => s + c.pct, 0) / completions.length)
    : 0;
  const stalled = completions.filter((c) => !c.lastActivity || (now - new Date(c.lastActivity).getTime()) > sevenDaysMs);

  const stats = [
    { label: "Onay Bekleyen",  value: pendingCount,  href: "/mentorship/admin/mentees",   color: "#f59e0b" },
    { label: "Aktif Mentee",   value: activeCount,   href: "/mentorship/admin/mentees",   color: "#34c97e" },
    { label: "Kurs",           value: courseCount,   href: "/mentorship/admin/courses",   color: "var(--color-accent)" },
    { label: "Kaynak",         value: resourceCount, href: "/mentorship/admin/resources", color: "var(--color-accent)" },
  ];

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Mentorship Admin</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Mentee onayları, kurs ve kaynak yönetimi</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}
            className="rounded-xl p-4 border hover:border-[var(--color-accent)] transition-colors"
            style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Mini analytics */}
      {activeMentees.length > 0 && (
        <div className="rounded-xl p-5 border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Genel Durum</h2>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Ortalama tamamlanma: <strong style={{ color: "var(--color-text-secondary)" }}>{avgCompletion}%</strong></span>
          </div>
          {stalled.length > 0 ? (
            <div>
              <p className="text-xs mb-2" style={{ color: "var(--color-warning)" }}>
                ⚠️ 7+ gündür ilerleme yok ({stalled.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {stalled.map((c) => (
                  <span key={c.email} className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.12)", color: "var(--color-warning)" }}>
                    {c.email} · {c.pct}%
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs" style={{ color: "var(--color-success)" }}>Tüm aktif mentee&apos;ler son 7 günde ilerleme kaydetti ✓</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/mentorship/admin/mentees"
          className="rounded-xl p-5 border flex flex-col gap-2 hover:border-[var(--color-accent)] transition-colors"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Mentee Yönetimi</span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Onay bekleyen ve aktif mentee'leri yönet</span>
        </Link>
        <Link href="/mentorship/admin/courses"
          className="rounded-xl p-5 border flex flex-col gap-2 hover:border-[var(--color-accent)] transition-colors"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Kurs Editörü</span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Kurs, bölüm ve ders oluştur</span>
        </Link>
        <Link href="/mentorship/admin/resources"
          className="rounded-xl p-5 border flex flex-col gap-2 hover:border-[var(--color-accent)] transition-colors"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Kaynak Kütüphanesi</span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Video, doküman ve link ekle</span>
        </Link>
      </div>
    </div>
  );
}
