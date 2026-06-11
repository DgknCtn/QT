import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";

// ─── Setup meta (static definitions) ─────────────────────────────────────────

const SETUP_META: Record<string, { color: string; desc: string; when: string; conditions: string }> = {
  REVERSAL: {
    color: "#ef4444",
    desc: "Trend tersine dönerken alınan setup. Liquidity sweep + SMT divergence + DFR sınırında structure shift.",
    when: "HTF yapısı döngü tamamladığında, sweep sonrası SMT divergence oluştuğunda.",
    conditions: "HTF likidite süpürüldü · SMT iki asset arasında · DFR high/low bölgesinde · M5+ structure shift",
  },
  CONTINUATION: {
    color: "#4f8ef7",
    desc: "Mevcut trend yönünde devam setupu. Pullback sonrası OB/FVG'den devam girişi.",
    when: "HTF bias netleştiğinde, retracement tamamlandığında, DFR mid tarafında.",
    conditions: "HTF bias net · Retracement kısmi (%38-62) · OB/FVG fresh · Momentum tarafta",
  },
  EXPANSION: {
    color: "#34c97e",
    desc: "Kırılım sonrası genişleme fazında alınan setup. PO3 distribution veya strong trend continuation.",
    when: "Q2 manipulation sonrası Q3 distribution başladığında, range kırıldığında.",
    conditions: "Range kırıldı · Volume artışı · DFR mid cleared · Session Q3+ içinde",
  },
  RETRACEMENT: {
    color: "#f59e0b",
    desc: "Premium/discount seviyelere retracement sonrası giriş. Silver Bullet veya kill zone modeli.",
    when: "NY AM kill zone içinde (10:00–11:00), Silver Bullet modeli oluştuğunda.",
    conditions: "Kill zone içinde · Liquidity sweep · FVG oluştu · HTF yönünde",
  },
  MISSED: {
    color: "#6366f1",
    desc: "Görülen ama girişi kaçırılan setup. Analiz ve öğrenme amaçlı loglanır.",
    when: "Geçerli bir setup oluştu ama giriş yapılamadı.",
    conditions: "Belgeleme amaçlı — puan hesaplamasına dahil edilmez",
  },
  CUSTOM: {
    color: "#9090a0",
    desc: "Yukarıdaki kategorilere girmeyen özel veya deneysel setup.",
    when: "Standart dışı bir konfigürasyonda.",
    conditions: "Kullanıcı tanımlı",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SetupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  const trades = dbUser
    ? await prisma.trade.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
        take: 200,
        select: {
          id: true, date: true, instrument: true, direction: true,
          setupType: true, result: true, rResult: true, processGrade: true,
          session: true,
        },
      }).catch(() => [])
    : [];

  // Group by setup type
  const groups: Record<string, typeof trades> = {};
  for (const t of trades) {
    const k = t.setupType ?? "CUSTOM";
    (groups[k] ??= []).push(t);
  }

  const ORDER = ["REVERSAL", "CONTINUATION", "EXPANSION", "RETRACEMENT", "MISSED", "CUSTOM"];

  // Overall stats
  const activeTrades = trades.filter((t) => !["NO_TRADE", "MISSED"].includes(t.result));
  const wins = activeTrades.filter((t) => t.result === "WIN").length;
  const totalWR = activeTrades.length ? Math.round((wins / activeTrades.length) * 100) : null;
  const totalR = trades.filter((t) => t.rResult != null).reduce((s, t) => s + (t.rResult ?? 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Overall header */}
      <div className="flex items-center gap-6">
        {[
          { label: "Total Trades", value: trades.length },
          { label: "Win Rate",     value: totalWR != null ? `${totalWR}%` : "—" },
          { label: "Net R",        value: totalR !== 0 ? `${totalR >= 0 ? "+" : ""}${totalR.toFixed(1)}R` : "—" },
          { label: "Setup Types",  value: Object.keys(groups).length },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</p>
            <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Setup cards */}
      <div className="space-y-3">
        {ORDER.map((setupType) => {
          const meta = SETUP_META[setupType];
          const typeTrades = groups[setupType] ?? [];
          const typeActive = typeTrades.filter((t) => !["NO_TRADE", "MISSED"].includes(t.result));
          const typeWins = typeActive.filter((t) => t.result === "WIN").length;
          const typeWR = typeActive.length ? Math.round((typeWins / typeActive.length) * 100) : null;
          const typeR = typeTrades.filter((t) => t.rResult != null).reduce((s, t) => s + (t.rResult ?? 0), 0);
          const typeAvgR = typeTrades.filter((t) => t.rResult != null).length
            ? (typeR / typeTrades.filter((t) => t.rResult != null).length).toFixed(1)
            : null;

          return (
            <div
              key={setupType}
              className="rounded-xl border p-5"
              style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
            >
              {/* Header row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-8 rounded-full flex-shrink-0"
                    style={{ background: meta.color }}
                  />
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                      {setupType.replace(/_/g, " ")}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{meta.desc}</p>
                  </div>
                </div>

                {/* Stats pills */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Trades</p>
                    <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{typeActive.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Win Rate</p>
                    <p className="text-sm font-bold" style={{ color: meta.color }}>{typeWR != null ? `${typeWR}%` : "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Avg R</p>
                    <p
                      className="text-sm font-bold"
                      style={{ color: (typeAvgR != null && parseFloat(typeAvgR) >= 0) ? "var(--color-success)" : "var(--color-danger)" }}
                    >
                      {typeAvgR != null ? `${parseFloat(typeAvgR) >= 0 ? "+" : ""}${typeAvgR}R` : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Win rate bar */}
              {typeActive.length > 0 && (
                <div className="mb-4">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${typeWR ?? 0}%`, background: meta.color }}
                    />
                  </div>
                </div>
              )}

              {/* Conditions */}
              <div className="flex gap-4 mb-3 text-xs flex-wrap">
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>Ne zaman: </span>
                  <span style={{ color: "var(--color-text-secondary)" }}>{meta.when}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {meta.conditions.split(" · ").map((cond) => (
                  <span
                    key={cond}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: `${meta.color}18`, color: meta.color }}
                  >
                    {cond}
                  </span>
                ))}
              </div>

              {/* Recent trades */}
              {typeTrades.length > 0 ? (
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>Son işlemler</p>
                  <div className="space-y-1">
                    {typeTrades.slice(0, 3).map((t) => (
                      <Link
                        key={t.id}
                        href={`/journal/${t.id}`}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                        style={{ background: "var(--color-bg-surface)" }}
                      >
                        <div className="flex items-center gap-3 text-xs">
                          <span style={{ color: "var(--color-text-muted)" }}>{format(new Date(t.date), "MMM d")}</span>
                          <span style={{ color: t.direction === "LONG" ? "var(--color-long)" : "var(--color-short)" }}>{t.direction}</span>
                          <span style={{ color: "var(--color-text-secondary)" }}>{t.instrument}</span>
                          <span style={{ color: "var(--color-text-muted)" }}>{t.session?.replace("_", " ")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {t.processGrade && (
                            <span className="font-bold" style={{
                              color: t.processGrade === "A_PLUS" ? "var(--color-success)" : t.processGrade === "RULE_BREAK" ? "var(--color-danger)" : t.processGrade === "B" ? "var(--color-accent)" : "var(--color-warning)",
                            }}>
                              {t.processGrade.replace("_", "+")}
                            </span>
                          )}
                          {t.rResult != null && (
                            <span className="font-bold" style={{ color: t.rResult >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                              {t.rResult >= 0 ? "+" : ""}{t.rResult.toFixed(1)}R
                            </span>
                          )}
                          <span
                            className="px-1.5 py-0.5 rounded font-bold"
                            style={{
                              background: t.result === "WIN" ? "rgba(52,201,126,0.15)" : t.result === "LOSS" ? "rgba(239,68,68,0.15)" : "rgba(144,144,160,0.1)",
                              color: t.result === "WIN" ? "var(--color-success)" : t.result === "LOSS" ? "var(--color-danger)" : "var(--color-text-muted)",
                            }}
                          >
                            {t.result}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {typeTrades.length > 3 && (
                    <Link href="/journal" className="text-xs mt-2 inline-block" style={{ color: "var(--color-accent)" }}>
                      +{typeTrades.length - 3} more →
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Bu setup ile henüz işlem loglanmadı.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
