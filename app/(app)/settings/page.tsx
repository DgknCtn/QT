import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SettingsForm
        initialName={user?.user_metadata?.name ?? ""}
        initialEmail={user?.email ?? ""}
        initialTimezone={user?.user_metadata?.timezone ?? "America/New_York"}
        initialMaxRisk={user?.user_metadata?.maxRiskPerTrade ?? 1.0}
        initialMaxDaily={user?.user_metadata?.maxDailyRisk ?? 3.0}
      />
    </div>
  );
}
