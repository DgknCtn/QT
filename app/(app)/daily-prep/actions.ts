"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteDailyPrep(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.dailyPrep.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/daily-prep");
  redirect("/daily-prep");
}
