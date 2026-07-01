import { prisma } from "@/lib/prisma";
import { GoalForm } from "./goal-form";
import { deleteGoal } from "./actions";
import { Target, Trash2 } from "lucide-react";

const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function ProgressBar({ value, target, color }: { value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const done = pct >= 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs" style={{ color: "var(--color-text-muted)" }}>
        <span>{value.toFixed(value % 1 === 0 ? 0 : 1)} / {target}</span>
        <span style={{ color: done ? "#34c97e" : "var(--color-text-muted)" }}>{Math.round(pct)}%{done ? " ✓" : ""}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-border)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export async function GoalsPanel({ userId }: { userId: string }) {
  const now = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Load all goals
  const goals = await prisma.monthlyGoal.findMany({
    where: { userId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  // Load trades for actuals — last 12 months
  const since = new Date(currentYear - 1, currentMonth - 1, 1);
  const trades = await prisma.trade.findMany({
    where: { userId, date: { gte: since } },
    select: { date: true, result: true, rResult: true },
  });

  // Current month goal
  const currentGoal = goals.find((g) => g.year === currentYear && g.month === currentMonth) ?? null;

  // Actuals for current month
  const thisMonthTrades = trades.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
  });
  const activeTrades = thisMonthTrades.filter((t) => !["NO_TRADE", "MISSED"].includes(t.result));
  const wins         = activeTrades.filter((t) => t.result === "WIN").length;
  const winRate      = activeTrades.length > 0 ? (wins / activeTrades.length) * 100 : 0;
  const totalR       = thisMonthTrades.reduce((s, t) => s + (t.rResult ?? 0), 0);

  // Function to get actuals for any month
  function monthActuals(year: number, month: number) {
    const mt = trades.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
    const act  = mt.filter((t) => !["NO_TRADE", "MISSED"].includes(t.result));
    const w    = act.filter((t) => t.result === "WIN").length;
    const wr   = act.length > 0 ? Math.round((w / act.length) * 100) : null;
    const r    = parseFloat(mt.reduce((s, t) => s + (t.rResult ?? 0), 0).toFixed(2));
    return { tradeCount: act.length, winRate: wr, totalR: r };
  }

  return (
    <div className="space-y-5">
      {/* Panel header */}
      <div className="flex items-center gap-3">
        <Target size={20} style={{ color: "var(--color-accent)" }} />
        <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Aylık Hedefler</h2>
      </div>

      {/* Current month progress */}
      <div className="rounded-xl border p-5 space-y-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {MONTHS[currentMonth - 1]} {currentYear} — Bu Ay
          </h3>
          {currentGoal && (
            <form action={async () => { "use server"; await deleteGoal(currentGoal.id); }}>
              <button type="submit" className="p-1 rounded hover:bg-white/5" style={{ color: "var(--color-text-muted)" }}>
                <Trash2 size={14} />
              </button>
            </form>
          )}
        </div>

        {currentGoal ? (
          <div className="grid md:grid-cols-3 gap-4">
            {/* R progress */}
            {currentGoal.targetR != null && (
              <div className="rounded-lg p-3 space-y-2" style={{ background: "var(--color-bg-surface)" }}>
                <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Toplam R</p>
                <p className="text-xl font-bold" style={{ color: totalR >= 0 ? "#34c97e" : "#ef4444" }}>
                  {totalR >= 0 ? "+" : ""}{totalR.toFixed(1)}R
                </p>
                <ProgressBar value={Math.max(totalR, 0)} target={currentGoal.targetR} color="#6366f1" />
              </div>
            )}

            {/* Win Rate progress */}
            {currentGoal.targetWinRate != null && (
              <div className="rounded-lg p-3 space-y-2" style={{ background: "var(--color-bg-surface)" }}>
                <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Win Rate</p>
                <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {activeTrades.length > 0 ? `${Math.round(winRate)}%` : "—"}
                </p>
                <ProgressBar value={winRate} target={currentGoal.targetWinRate} color="#34c97e" />
              </div>
            )}

            {/* Trade count progress */}
            {currentGoal.targetTrades != null && (
              <div className="rounded-lg p-3 space-y-2" style={{ background: "var(--color-bg-surface)" }}>
                <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Trade Sayısı</p>
                <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{activeTrades.length}</p>
                <ProgressBar value={activeTrades.length} target={currentGoal.targetTrades} color="#f59e0b" />
              </div>
            )}

            {currentGoal.notes && (
              <div className="md:col-span-3 text-xs leading-relaxed pt-1 border-t" style={{ borderColor: "var(--color-bg-border)", color: "var(--color-text-muted)" }}>
                {currentGoal.notes}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Bu ay için henüz hedef belirlenmedi. Aşağıdan ekleyebilirsin.
          </p>
        )}
      </div>

      {/* Add / Edit current month goal form */}
      <div className="rounded-xl border p-5 space-y-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          Hedef Ekle / Güncelle
        </h3>
        <GoalForm
          defaultYear={currentYear}
          defaultMonth={currentMonth}
          existing={currentGoal}
        />
      </div>

      {/* Past goals table */}
      {goals.length > 0 && (
        <div className="rounded-xl border p-5 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Geçmiş Hedefler</h3>
          <div className="space-y-2">
            {goals.map((g) => {
              const actuals = monthActuals(g.year, g.month);
              const isCurrent = g.year === currentYear && g.month === currentMonth;
              return (
                <div key={g.id} className="rounded-lg p-3" style={{ background: "var(--color-bg-surface)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {MONTHS[g.month - 1]} {g.year}
                      {isCurrent && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>Bu ay</span>}
                    </span>
                    <form action={async () => { "use server"; await deleteGoal(g.id); }}>
                      <button type="submit" style={{ color: "var(--color-text-muted)" }}>
                        <Trash2 size={12} />
                      </button>
                    </form>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs">
                    {g.targetR != null && (
                      <span>
                        <span style={{ color: "var(--color-text-muted)" }}>R: </span>
                        <span style={{ color: actuals.totalR >= g.targetR ? "#34c97e" : "var(--color-text-secondary)" }}>
                          {actuals.totalR >= 0 ? "+" : ""}{actuals.totalR}R
                        </span>
                        <span style={{ color: "var(--color-text-muted)" }}> / +{g.targetR}R</span>
                      </span>
                    )}
                    {g.targetWinRate != null && (
                      <span>
                        <span style={{ color: "var(--color-text-muted)" }}>WR: </span>
                        <span style={{ color: (actuals.winRate ?? 0) >= g.targetWinRate ? "#34c97e" : "var(--color-text-secondary)" }}>
                          {actuals.winRate ?? "—"}%
                        </span>
                        <span style={{ color: "var(--color-text-muted)" }}> / {g.targetWinRate}%</span>
                      </span>
                    )}
                    {g.targetTrades != null && (
                      <span>
                        <span style={{ color: "var(--color-text-muted)" }}>Trades: </span>
                        <span style={{ color: actuals.tradeCount >= g.targetTrades ? "#34c97e" : "var(--color-text-secondary)" }}>
                          {actuals.tradeCount}
                        </span>
                        <span style={{ color: "var(--color-text-muted)" }}> / {g.targetTrades}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
