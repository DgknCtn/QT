import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { approveMentee, rejectMentee } from "../../actions";
import Link from "next/link";

export default async function AdminMenteesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") redirect("/mentorship");

  const profiles = await prisma.menteeProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } } },
  });

  const pending  = profiles.filter(p => p.status === "PENDING");
  const active   = profiles.filter(p => p.status === "ACTIVE");
  const rejected = profiles.filter(p => p.status === "REJECTED");

  const statusBadge = (s: string) => {
    if (s === "ACTIVE")   return { label: "Aktif",    color: "#34c97e", bg: "rgba(52,201,126,0.12)" };
    if (s === "PENDING")  return { label: "Bekliyor", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
    return                       { label: "Reddedildi", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
  };

  const Section = ({ title, items }: { title: string; items: typeof profiles }) => (
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
                <th className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Durum</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const badge = statusBadge(p.status);
                return (
                  <tr key={p.id} style={{ borderTop: "1px solid var(--color-bg-border)", background: "var(--color-bg-surface)" }}>
                    <td className="px-4 py-3" style={{ color: "var(--color-text-primary)" }}>{p.user.email}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {new Date(p.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ color: badge.color, background: badge.bg }}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
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

  return (
    <div className="p-6 max-w-4xl space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/mentorship/admin" className="text-xs" style={{ color: "var(--color-text-muted)" }}>← Admin</Link>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Mentee Yönetimi</h1>
      </div>
      <Section title={`Onay Bekleyen (${pending.length})`} items={pending} />
      <Section title={`Aktif Mentee'ler (${active.length})`} items={active} />
      <Section title={`Reddedilenler (${rejected.length})`} items={rejected} />
    </div>
  );
}
