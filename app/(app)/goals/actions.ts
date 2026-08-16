"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/auth";
import { optionalInt, optionalNumber, optionalString, requiredInt } from "@/lib/schemas/form";
import { revalidatePath } from "next/cache";

export async function saveGoal(formData: FormData) {
  const user = await ensureUser();

  const year  = requiredInt(formData, "year", "Yıl");
  const month = requiredInt(formData, "month", "Ay");

  const targetR       = optionalNumber(formData, "targetR", "Hedef R");
  const targetWinRate = optionalNumber(formData, "targetWinRate", "Hedef kazanma oranı");
  const targetTrades  = optionalInt(formData, "targetTrades", "Hedef işlem sayısı");
  const notes         = optionalString(formData, "notes");

  await prisma.monthlyGoal.upsert({
    where: { userId_year_month: { userId: user.id, year, month } },
    update:  { targetR, targetWinRate, targetTrades, notes },
    create:  { userId: user.id, year, month, targetR, targetWinRate, targetTrades, notes },
  });

  revalidatePath("/goals");
  revalidatePath("/accounts");
}

export async function deleteGoal(id: string) {
  const user = await ensureUser();
  await prisma.monthlyGoal.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/goals");
  revalidatePath("/accounts");
}
