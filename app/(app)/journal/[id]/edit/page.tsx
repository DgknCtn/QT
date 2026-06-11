import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { TradeForm } from "@/app/(app)/journal/new/trade-form";

export default async function EditTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trade = await prisma.trade.findFirst({
    where: { id, userId: user.id },
    include: { tags: { include: { tag: true } } },
  });
  if (!trade) notFound();

  const recentPreps = await prisma.dailyPrep.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 20,
    select: { id: true, date: true, triad: true, htfBias: true, goNoGoStatus: true },
  });

  const mistakeTags = trade.tags.filter((tt) => tt.tag.category === "MISTAKE").map((tt) => tt.tag.name);
  const positiveTags = trade.tags.filter((tt) => tt.tag.category === "POSITIVE").map((tt) => tt.tag.name);

  const initialData = {
    date: format(new Date(trade.date), "yyyy-MM-dd"),
    instrument: trade.instrument,
    marketGroup: trade.marketGroup ?? "",
    triad: trade.triad ?? "",
    session: trade.session ?? "",
    direction: trade.direction ?? "",
    setupType: trade.setupType ?? "",
    entryModel: trade.entryModel ?? "",
    entryPrice: trade.entryPrice != null ? String(trade.entryPrice) : "",
    stopPrice: trade.stopPrice != null ? String(trade.stopPrice) : "",
    tp1: trade.tp1 != null ? String(trade.tp1) : "",
    tp2: trade.tp2 != null ? String(trade.tp2) : "",
    tp3: trade.tp3 != null ? String(trade.tp3) : "",
    riskPercent: trade.riskPercent != null ? String(trade.riskPercent) : "",
    rResult: trade.rResult != null ? String(trade.rResult) : "",
    pnlPoints: trade.pnlPoints != null ? String(trade.pnlPoints) : "",
    pnlCurrency: trade.pnlCurrency != null ? String(trade.pnlCurrency) : "",
    result: trade.result ?? "",
    dailyPrepId: trade.dailyPrepId ?? "",
    planFollowed: trade.planFollowed ?? "",
    goStatusAtEntry: trade.goStatusAtEntry ?? "",
    notes: trade.notes ?? "",
    mistakeTags,
    positiveTags,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-6">
      <div className="flex items-center gap-2">
        <Link href={`/journal/${id}`} className="inline-flex items-center gap-1.5 text-xs hover:underline" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={12} /> Geri
        </Link>
        <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Trade Düzenle</h1>
      </div>
      <TradeForm
        userId={user.id}
        recentPreps={recentPreps}
        initialData={initialData}
        tradeId={id}
      />
    </div>
  );
}
