import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";
import { RiskLimitsForm } from "./risk-limits-form";
import { NotificationSettings } from "./notification-settings";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const limits = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { dailyLossLimitUsd: true, maxConsecutiveLosses: true, maxRiskPerTrade: true },
      })
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SettingsForm
        initialName={user?.user_metadata?.name ?? ""}
        initialEmail={user?.email ?? ""}
        initialTimezone={user?.user_metadata?.timezone ?? "America/New_York"}
        initialMaxRisk={limits?.maxRiskPerTrade ?? 1.0}
      />
      <RiskLimitsForm
        initialDailyLoss={limits?.dailyLossLimitUsd ?? 0}
        initialMaxStreak={limits?.maxConsecutiveLosses ?? 0}
      />
      <NotificationSettings />
    </div>
  );
}
