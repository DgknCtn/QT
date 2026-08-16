import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { TradeForm } from "./trade-form";
import { format } from "date-fns";

export default async function NewTradePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Load today's preps for linking
  const recentPreps = user
    ? await prisma.dailyPrep.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
        take: 5,
        select: { id: true, date: true, triad: true, htfBias: true, goNoGoStatus: true },
      }).catch(() => [])
    : [];

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-xs mb-5" style={{ color: "var(--color-text-muted)" }}>
        {format(new Date(), "EEEE, MMMM d, yyyy")}
      </p>
      <TradeForm userId={user!.id} recentPreps={recentPreps} />
    </div>
  );
}
