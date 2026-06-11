"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function ensureUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email ?? "" },
  });

  return user;
}

export async function saveGoal(formData: FormData) {
  const user = await ensureUser();

  const year  = parseInt(formData.get("year")  as string, 10);
  const month = parseInt(formData.get("month") as string, 10);

  const targetR        = formData.get("targetR")        ? parseFloat(formData.get("targetR") as string)        : null;
  const targetWinRate  = formData.get("targetWinRate")  ? parseFloat(formData.get("targetWinRate") as string)  : null;
  const targetTrades   = formData.get("targetTrades")   ? parseInt(formData.get("targetTrades") as string, 10) : null;
  const notes          = (formData.get("notes") as string) || null;

  await prisma.monthlyGoal.upsert({
    where: { userId_year_month: { userId: user.id, year, month } },
    update:  { targetR, targetWinRate, targetTrades, notes },
    create:  { userId: user.id, year, month, targetR, targetWinRate, targetTrades, notes },
  });

  revalidatePath("/goals");
}

export async function deleteGoal(id: string) {
  const user = await ensureUser();
  await prisma.monthlyGoal.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/goals");
}
