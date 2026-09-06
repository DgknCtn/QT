"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { FormValidationError, requiredNumber, requiredInt } from "@/lib/schemas/form";
import { revalidatePath } from "next/cache";

type State = { error: string; success: boolean };

export async function saveSettings(_prev: State, formData: FormData): Promise<State> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();

    // İşlem başına risk %'si `User` tablosuna yazılıyor, metadata'ya değil:
    // sunucu tarafındaki risk hesaplayıcı bunu okuyabilmek zorunda.
    // Metadata'ya yazıldığı sürece hiçbir sorgu göremiyordu, yani ayar
    // kaydediliyor ama hiçbir şeyi etkilemiyordu.
    const maxRiskPerTrade = requiredNumber(formData, "maxRiskPerTrade", "İşlem başına risk");
    if (maxRiskPerTrade <= 0 || maxRiskPerTrade > 10) {
      throw new FormValidationError("İşlem başına risk 0 ile 10 arasında olmalı.");
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        name: formData.get("name"),
        timezone: formData.get("timezone"),
        preferredSessions: formData.getAll("sessions"),
      },
    });
    if (error) return { error: error.message, success: false };

    await prisma.user.update({ where: { id: userId }, data: { maxRiskPerTrade } });

    revalidatePath("/settings");
    revalidatePath("/risk-calculator");
    return { error: "", success: true };
  } catch (e) {
    if (e instanceof FormValidationError) return { error: e.message, success: false };
    return { error: "Ayarlar kaydedilemedi.", success: false };
  }
}

/**
 * Risk Guard limitleri.
 *
 * Sayfadaki diğer tercihler Supabase `user_metadata`'da duruyor ve hiçbir
 * sunucu sorgusu onları göremiyor. Bu ikisi `User` tablosuna yazılıyor,
 * çünkü dashboard her yüklemede sunucu tarafında okumak zorunda.
 */
export async function saveRiskLimits(_prev: State, formData: FormData): Promise<State> {
  try {
    const userId = await requireUserId();

    const dailyLossLimitUsd = requiredNumber(formData, "dailyLossLimitUsd", "Günlük zarar limiti");
    const maxConsecutiveLosses = requiredInt(formData, "maxConsecutiveLosses", "Ardışık kayıp sınırı");

    if (dailyLossLimitUsd < 0) throw new FormValidationError("Günlük zarar limiti negatif olamaz.");
    if (maxConsecutiveLosses < 0 || maxConsecutiveLosses > 20) {
      throw new FormValidationError("Ardışık kayıp sınırı 0 ile 20 arasında olmalı.");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { dailyLossLimitUsd, maxConsecutiveLosses },
    });

    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return { error: "", success: true };
  } catch (e) {
    if (e instanceof FormValidationError) return { error: e.message, success: false };
    return { error: "Limitler kaydedilemedi.", success: false };
  }
}
