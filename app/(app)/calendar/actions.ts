"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { EventRiskTag } from "@prisma/client";

async function ensureUser(userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: user?.email ?? "", name: user?.user_metadata?.name ?? null },
  });
}

export async function saveEvent(userId: string, form: FormData): Promise<void> {
  await ensureUser(userId);

  const id = form.get("id") as string | null;
  const data = {
    dateTime: new Date(`${form.get("date")}T${form.get("time")}:00`),
    currency: (form.get("currency") as string).toUpperCase(),
    eventName: form.get("eventName") as string,
    impact: (form.get("impact") as "HIGH" | "MEDIUM" | "LOW") ?? "MEDIUM",
    userRiskTag: ((form.get("userRiskTag") as string) || null) as EventRiskTag | null,
    noTradeBeforeMinutes: form.get("noTradeBefore") ? parseInt(form.get("noTradeBefore") as string, 10) : null,
    noTradeAfterMinutes: form.get("noTradeAfter") ? parseInt(form.get("noTradeAfter") as string, 10) : null,
    notes: (form.get("notes") as string) || null,
  };

  if (id) {
    await prisma.economicEvent.update({ where: { id }, data });
  } else {
    await prisma.economicEvent.create({ data: { userId, ...data } });
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function deleteEvent(userId: string, eventId: string): Promise<void> {
  await prisma.economicEvent.deleteMany({ where: { id: eventId, userId } });
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}
