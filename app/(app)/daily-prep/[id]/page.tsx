import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle, MinusCircle } from "lucide-react";

const SESSION_LABEL: Record<string, string> = {
  ASIA: "Asia", LONDON: "London", NY_AM: "NY AM", NY_PM: "NY PM",
};

const BIAS_COLOR: Record<string, string> = {
  LONG: "var(--color-long)", SHORT: "var(--color-short)", WAIT: "var(--color-wait)", NEUTRAL: "var(--color-text-muted)",
};

const GONOGO = {
  GO:            { label: "GO",           color: "var(--color-go)",         Icon: CheckCircle2 },
  NO_GO:         { label: "NO-GO",        color: "var(--color-nogo)",        Icon: XCircle },
  WAIT:          { label: "WAIT",         color: "var(--color-wait)",        Icon: Clock },
  REVIEW_LATER:  { label: "REVIEW LATER", color: "var(--color-warn)",        Icon: AlertCircle },
  MISSED_SETUP:  { label: "MISSED",       color: "var(--color-text-muted)",  Icon: MinusCircle },
} as const;

export default async function DailyPrepDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const prep = await prisma.dailyPrep.findFirst({
    where: { id, userId: user.id },
  });

  if (!prep) notFound();

  const gonogo = prep.goNoGoStatus ? GONOGO[prep.goNoGoStatus as keyof typeof GONOGO] : null;
  const newsEvents = (prep.newsSummary as { events?: { eventName: string; time: string; currency: string; impact: string; riskTag: string }[] })?.events ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/daily-prep"
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {format(new Date(prep.date), "EEEE, MMMM d, yyyy")}
          </p>
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {prep.triad?.replace(/_/g, " ")} · {SESSION_LABEL[prep.session] ?? prep.session}
          </h2>
        </div>
        {gonogo && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold"
            style={{ background: `${gonogo.color}22`, color: gonogo.color, border: `1px solid ${gonogo.color}44` }}>
            <gonogo.Icon size={13} />
            {gonogo.label}
          </div>
        )}
      </div>

      {/* Market */}
      <div className="rounded-xl border p-4 space-y-2" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Market</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Primary</span>
            <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{prep.primaryInstrument}</p>
          </div>
          {prep.secondaryInstruments.length > 0 && (
            <div>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Confirmation</span>
              <p className="font-medium" style={{ color: "var(--color-text-secondary)" }}>{prep.secondaryInstruments.join(", ")}</p>
            </div>
          )}
          <div>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Session</span>
            <p className="font-medium" style={{ color: "var(--color-text-secondary)" }}>{SESSION_LABEL[prep.session] ?? prep.session}</p>
          </div>
        </div>
      </div>

      {/* HTF Narrative */}
      <div className="rounded-xl border p-4 space-y-3" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>HTF Narrative</p>
        <div className="flex flex-wrap gap-4 text-sm">
          {prep.htfBias && (
            <div>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Bias</span>
              <p className="font-bold text-base" style={{ color: BIAS_COLOR[prep.htfBias] ?? "var(--color-text-primary)" }}>{prep.htfBias}</p>
            </div>
          )}
          {prep.htfTarget && (
            <div>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Target / DOL</span>
              <p className="font-medium" style={{ color: "var(--color-text-secondary)" }}>{prep.htfTarget}</p>
            </div>
          )}
        </div>
        {prep.htfBiasExplanation && (
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{prep.htfBiasExplanation}</p>
        )}
        <div className="flex flex-wrap gap-3 pt-1 border-t text-xs" style={{ borderColor: "var(--color-bg-border)" }}>
          {prep.weeklyPo3State && <span style={{ color: "var(--color-text-muted)" }}>Weekly PO3: <span style={{ color: "var(--color-text-secondary)" }}>{prep.weeklyPo3State}</span></span>}
          {prep.dailyPo3State && <span style={{ color: "var(--color-text-muted)" }}>Daily PO3: <span style={{ color: "var(--color-text-secondary)" }}>{prep.dailyPo3State}</span></span>}
          {prep.mmxmStage && <span style={{ color: "var(--color-text-muted)" }}>MMxM: <span style={{ color: "var(--color-text-secondary)" }}>{prep.mmxmStage.replace(/_/g, " ")}</span></span>}
        </div>
      </div>

      {/* Cycle */}
      {(prep.activeCycleWeekly || prep.activeCycleDaily || prep.active90mCycle) && (
        <div className="rounded-xl border p-4 space-y-2" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Cycle & Quarter</p>
          <div className="flex flex-wrap gap-4 text-sm">
            {prep.activeCycleWeekly && <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Weekly</span><p style={{ color: "var(--color-text-secondary)" }}>{prep.activeCycleWeekly.replace(/_/g, " ")}</p></div>}
            {prep.activeCycleDaily && <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Daily</span><p style={{ color: "var(--color-text-secondary)" }}>{prep.activeCycleDaily.replace(/_/g, " ")}</p></div>}
            {prep.active90mCycle && <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>90m</span><p style={{ color: "var(--color-text-secondary)" }}>{prep.active90mCycle}</p></div>}
          </div>
        </div>
      )}

      {/* News */}
      {newsEvents.length > 0 && (
        <div className="rounded-xl border p-4 space-y-2" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Economic Events</p>
          <div className="space-y-1.5">
            {newsEvents.map((evt, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: evt.impact === "HIGH" ? "rgba(239,68,68,0.15)" : evt.impact === "MEDIUM" ? "rgba(245,158,11,0.15)" : "rgba(52,201,126,0.15)",
                    color: evt.impact === "HIGH" ? "var(--color-danger)" : evt.impact === "MEDIUM" ? "var(--color-warning)" : "var(--color-success)",
                  }}
                >{evt.impact}</span>
                <span style={{ color: "var(--color-text-primary)" }}>{evt.eventName}</span>
                <span style={{ color: "var(--color-text-muted)" }}>{evt.time} · {evt.currency}</span>
                <span className="ml-auto px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--color-bg-surface)", color: "var(--color-text-muted)" }}>{evt.riskTag?.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GO/NO-GO */}
      {prep.goNoGoStatus && (
        <div className="rounded-xl border p-4 space-y-2" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>GO / NO-GO Decision</p>
          {prep.goNoGoReason && <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{prep.goNoGoReason}</p>}
        </div>
      )}

      {/* Notes */}
      {prep.notes && (
        <div className="rounded-xl border p-4" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>Notes</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{prep.notes}</p>
        </div>
      )}

      {/* Completion */}
      <div className="rounded-xl border p-4 flex items-center justify-between" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Completion Score</span>
        <span className="text-sm font-bold" style={{ color: prep.completionScore >= 80 ? "var(--color-success)" : prep.completionScore >= 50 ? "var(--color-warning)" : "var(--color-text-secondary)" }}>
          {Math.round(prep.completionScore)}%
        </span>
      </div>
    </div>
  );
}
