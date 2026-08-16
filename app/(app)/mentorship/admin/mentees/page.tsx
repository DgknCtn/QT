import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { approveMentee, rejectMentee } from "../../actions";
import Link from "next/link";


function getProfiles() {
  return prisma.menteeProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
      progress: { select: { id: true } },
    },
  });
}

type Profile = Awaited<ReturnType<typeof getProfiles>>[number];

function statusBadge(s: string) {
  if (s === "ACTIVE")  return { label: "Aktif",      color: "#34c97e", bg: "rgba(52,201,126,0.12)" };
  if (s === "PENDING") return { label: "Bekliyor",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  return                      { label: "Reddedildi", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
}

/** Defined at module scope: declaring a component inside another component
    recreates its type on every render and remounts the subtree. */
function Section({ title, items, showProgress, totalLessons }: {
  title: string; items: Profile[]; showProgress?: boolean; totalLessons: number;
}) {
  return (
    <div>
      <h2 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Kayıt yok.</p>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-bg-border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-bg-border)" }}>
                <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>E-posta</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Tarih</th>
                {showProgress && (
                  <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>İlerleme</th>
                )}
                <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Durum</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const badge = statusBadge(p.status);
                const done  = p.progress.length;
                const pct   = totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0;
                return (
                  <tr key={p.id} style={{ borderTop: "1px solid var(--color-bg-border)", background: "var(--color-bg-surface)" }}>
                    <td className="px-4 py-3" style={{ color: "var(--color-text-primary)" }}>
                      <Link href={`/mentorship/admin/mentees/${p.userId}`}
                        className="hover:underline font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {p.user.email}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {new Date(p.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    {showProgress && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-[120px]">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? "#34c97e" : "var(--color-accent)" }} />
                          </div>
                          <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>
                            {done}/{totalLessons}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ color: badge.color, background: badge.bg }}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        {showProgress && (
                          <Link href={`/mentorship/admin/mentees/${p.userId}`}
                            className="px-3 py-1 rounded text-xs font-medium"
                            style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)" }}>
                            Detay
                          </Link>
                        )}
                        {p.status === "PENDING" && (
                          <>
                            <form action={approveMentee.bind(null, p.userId)}>
                              <button type="submit" className="px-3 py-1 rounded text-xs font-medium"
                                style={{ background: "rgba(52,201,126,0.15)", color: "#34c97e" }}>
                                Onayla
                              </button>
                            </form>
                            <form action={rejectMentee.bind(null, p.userId)}>
                              <button type="submit" className="px-3 py-1 rounded text-xs font-medium"
                                style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                                Reddet
                              </button>
                            </form>
                          </>
                        )}
                        {p.status === "ACTIVE" && (
                          <form action={rejectMentee.bind(null, p.userId)}>
                            <button type="submit" className="px-3 py-1 rounded text-xs font-medium"
                              style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                              Erişimi Kaldır
                            </button>
                          </form>
                        )}
                        {p.status === "REJECTED" && (
                          <form action={approveMentee.bind(null, p.userId)}>
                            <button type="submit" className="px-3 py-1 rounded text-xs font-medium"
                              style={{ background: "rgba(52,201,126,0.15)", color: "#34c97e" }}>
                              Onayla
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default async function AdminMenteesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") redirect("/mentorship");

  // Total published lessons across all courses
  const totalLessons = await prisma.lesson.count({ where: { isPublished: true } });

  const profiles = await getProfiles();

  const pending  = profiles.filter(p => p.status === "PENDING");
  const active   = profiles.filter(p => p.status === "ACTIVE");
  const rejected = profiles.filter(p => p.status === "REJECTED");




  return (
    <div className="p-6 max-w-4xl space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/mentorship/admin" className="text-xs" style={{ color: "var(--color-text-muted)" }}>← Admin</Link>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Mentee Yönetimi</h1>
      </div>
      <Section title={`Onay Bekleyen (${pending.length})`}   items={pending}  totalLessons={totalLessons} />
      <Section title={`Aktif Mentee'ler (${active.length})`} items={active}   totalLessons={totalLessons} showProgress />
      <Section title={`Reddedilenler (${rejected.length})`}  items={rejected} totalLessons={totalLessons} />
    </div>
  );
}
