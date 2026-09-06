import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { RiskCalculator } from "./risk-calculator";

/**
 * Sunucu tarafı yalnızca ayarı okur; hesabın tamamı istemcide.
 *
 * Sayfa eskiden baştan sona `"use client"`'dı, bu yüzden kullanıcının
 * ayarlardaki risk yüzdesini okuyamıyor ve risk% alanını "1"e sabitliyordu.
 */
export default async function RiskCalculatorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const settings = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { maxRiskPerTrade: true },
      })
    : null;

  return <RiskCalculator defaultRiskPct={settings?.maxRiskPerTrade ?? 1} />;
}
