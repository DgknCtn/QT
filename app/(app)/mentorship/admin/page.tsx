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

  const [pendingCount, activeCount, courseCount, resourceCount] = await Promise.all([
    prisma.menteeProfile.count({ where: { status: "PENDING" } }),
    prisma.menteeProfile.count({ where: { status: "ACTIVE" } }),
    prisma.course.count(),
    prisma.resource.count(),
  ]);

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
