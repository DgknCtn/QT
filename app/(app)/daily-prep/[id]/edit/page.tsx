import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { PrepWizard } from "../../new/prep-wizard";
import { getCalendarEventsForDate } from "../../new/actions";
import type { PrepFormData, TrueOpenEntry, NewsEvent } from "../../new/types";

export default async function EditPrepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const prep = await prisma.dailyPrep.findFirst({ where: { id, userId: user.id } });
  if (!prep) notFound();

  const calendarEvents = await getCalendarEventsForDate(user.id, new Date(prep.date));

  const trueOpens = (prep.trueOpenSummary as Record<string, TrueOpenEntry> | null) ?? {
    TYO:  { price: "", position: "", interpretation: "", notes: "" },
    TMO:  { price: "", position: "", interpretation: "", notes: "" },
    TWO:  { price: "", position: "", interpretation: "", notes: "" },
    TDO:  { price: "", position: "", interpretation: "", notes: "" },
    TSO:  { price: "", position: "", interpretation: "", notes: "" },
    TMSO: { price: "", position: "", interpretation: "", notes: "" },
  };

  const dfrRaw = prep.dfrSummary as Record<string, unknown> | null;
  const ssmtRaw = prep.ssmtSummary as Record<string, unknown> | null;
  const confirmRaw = prep.confirmationSummary as Record<string, unknown> | null;
  const newsRaw = prep.newsSummary as { events?: NewsEvent[] } | null;

  const initialData: PrepFormData = {
    session: prep.session ?? "",
    marketGroup: prep.marketGroup ?? "",
    triad: prep.triad ?? "",
    primaryInstrument: prep.primaryInstrument ?? "",
    secondaryInstruments: prep.secondaryInstruments ?? [],
    htfBias: prep.htfBias ?? "",
    htfBiasConfidence: prep.htfBiasConfidence ?? "MEDIUM",
    htfTarget: prep.htfTarget ?? "",
    htfInvalidation: prep.htfInvalidation ?? "",
    htfBiasExplanation: prep.htfBiasExplanation ?? "",
    weeklyPo3State: prep.weeklyPo3State ?? "UNKNOWN",
    dailyPo3State: prep.dailyPo3State ?? "UNKNOWN",
    mmxmStage: prep.mmxmStage ?? "UNKNOWN",
    mainLiquidityTarget: prep.mainLiquidityTarget ?? "",
    customLiqTarget: prep.customLiqTarget ?? "",
    newsEvents: newsRaw?.events ?? [],
    activeCycleWeekly: prep.activeCycleWeekly ?? "",
    activeCycleDaily: prep.activeCycleDaily ?? "",
    active90mCycle: prep.active90mCycle ?? "",
    activeMicroCycle: prep.activeMicroCycle ?? "",
    q1Quality: prep.q1Quality ?? "",
    expectedBehavior: prep.expectedBehavior ?? "",
    trueOpens: trueOpens as Record<string, TrueOpenEntry>,
    dfr: {
      dfrType:          String(dfrRaw?.dfrType ?? ""),
      dfrHigh:          String(dfrRaw?.dfrHigh ?? ""),
      dfrLow:           String(dfrRaw?.dfrLow ?? ""),
      dfrMid:           String(dfrRaw?.dfrMid ?? ""),
      q1Quality:        String(dfrRaw?.q1Quality ?? ""),
      highLowEqualsQ1:  String(dfrRaw?.highLowEqualsQ1 ?? ""),
      alignsWithBias:   Boolean(dfrRaw?.alignsWithBias ?? false),
      nearPriorPoi:     Boolean(dfrRaw?.nearPriorPoi ?? false),
      notes:            String(dfrRaw?.notes ?? ""),
    },
    ssmt: {
      formed:          String(ssmtRaw?.formed ?? ""),
      ssmtType:        String(ssmtRaw?.ssmtType ?? ""),
      locationType:    String(ssmtRaw?.locationType ?? ""),
      locationPrice:   String(ssmtRaw?.locationPrice ?? ""),
      timeframe:       String(ssmtRaw?.timeframe ?? ""),
      assetABehavior:  String(ssmtRaw?.assetABehavior ?? ""),
      assetBBehavior:  String(ssmtRaw?.assetBBehavior ?? ""),
      assetCBehavior:  String(ssmtRaw?.assetCBehavior ?? ""),
      strongAsset:     String(ssmtRaw?.strongAsset ?? ""),
      weakAsset:       String(ssmtRaw?.weakAsset ?? ""),
      alignsWithBias:  String(ssmtRaw?.alignsWithBias ?? ""),
      randomSmtFlag:   Boolean(ssmtRaw?.randomSmtFlag ?? false),
      notes:           String(ssmtRaw?.notes ?? ""),
    },
    confirmation: {
      confirmationType: String(confirmRaw?.confirmationType ?? ""),
      timeframe:        String(confirmRaw?.timeframe ?? ""),
      tfAlignmentValid: String(confirmRaw?.tfAlignmentValid ?? ""),
      notes:            String(confirmRaw?.notes ?? ""),
    },
    entry: {
      entryModel:  "",
      entryPrice:  "",
      stopPrice:   "",
      stopLogic:   "",
      tp1:         "",
      tp2:         "",
      tp3:         "",
      mainDol:     "",
      riskPercent: "",
      riskUsd:     "",
    },
    goNoGoStatus: prep.goNoGoStatus ?? "",
    goNoGoReason: prep.goNoGoReason ?? "",
    notes: prep.notes ?? "",
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-5">
        <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>
          {format(new Date(prep.date), "EEEE, MMMM d, yyyy")}
        </p>
        <h2 className="text-base font-semibold" style={{ color: "var(--color-text-secondary)" }}>
          Daily Prep Düzenle
        </h2>
      </div>
      <PrepWizard
        userId={user.id}
        calendarEvents={calendarEvents}
        initialData={initialData}
        prepId={id}
      />
    </div>
  );
}
