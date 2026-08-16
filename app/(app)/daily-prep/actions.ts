"use server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteDailyPrep(id: string) {
  const userId = await requireUserId();

  await prisma.dailyPrep.deleteMany({ where: { id, userId } });
  revalidatePath("/daily-prep");
  redirect("/daily-prep");
}
