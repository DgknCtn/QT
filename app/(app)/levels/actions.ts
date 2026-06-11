"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { LevelType, LevelStatus, MarketGroup, Timeframe } from "@/app/generated/prisma/client";

async function ensureUser(userId: string, email: string) {
  await prisma.user.upsert({
    where:  { id: userId },
    update: {},
    create: { id: userId, email },
  });
}

export async function saveLevel(levelId: string | null, form: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await ensureUser(user.id, user.email ?? "");

  const data = {
    userId:        user.id,
    instrument:    (form.get("instrument") as string).trim().toUpperCase(),
    marketGroup:   form.get("marketGroup") as MarketGroup,
    levelType:     form.get("levelType") as LevelType,
    price:         parseFloat(form.get("price") as string),
    timeframe:     form.get("timeframe") as Timeframe,
    status:        (form.get("status") as LevelStatus) || "ACTIVE",
    dateValidFrom: form.get("dateValidFrom") ? new Date(form.get("dateValidFrom") as string) : null,
    dateValidTo:   form.get("dateValidTo")   ? new Date(form.get("dateValidTo")   as string) : null,
    notes:         (form.get("notes") as string) || null,
  };

  if (levelId) {
    await prisma.level.update({ where: { id: levelId, userId: user.id }, data });
  } else {
    await prisma.level.create({ data });
  }
  revalidatePath("/levels");
}

export async function deleteLevel(levelId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await prisma.level.delete({ where: { id: levelId, userId: user.id } });
  revalidatePath("/levels");
}

export async function toggleLevelStatus(levelId: string, current: LevelStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const next: LevelStatus = current === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await prisma.level.update({
    where: { id: levelId, userId: user.id },
    data:  { status: next },
  });
  revalidatePath("/levels");
}
