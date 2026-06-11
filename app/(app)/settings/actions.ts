"use server";

import { createClient } from "@/lib/supabase/server";

type State = { error: string; success: boolean };

export async function saveSettings(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    data: {
      name: formData.get("name"),
      timezone: formData.get("timezone"),
      maxRiskPerTrade: parseFloat((formData.get("maxRiskPerTrade") as string) || "1"),
      maxDailyRisk: parseFloat((formData.get("maxDailyRisk") as string) || "3"),
      preferredSessions: formData.getAll("sessions"),
    },
  });

  if (error) return { error: error.message, success: false };
  return { error: "", success: true };
}
