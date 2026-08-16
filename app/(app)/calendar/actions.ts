"use server";

import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/auth";
import {
  optionalEnum,
  optionalInt,
  optionalString,
  requiredEnum,
  requiredString,
  FormValidationError,
} from "@/lib/schemas/form";
import { revalidatePath } from "next/cache";
import type { EventRiskTag } from "@prisma/client";

const IMPACTS = ["HIGH", "MEDIUM", "LOW"] as const;
const RISK_TAGS = [
  "IGNORE", "WATCH", "HIGH_RISK", "NO_TRADE_WINDOW", "DATA_HIGH_LOW_RELEVANT",
] as const satisfies readonly EventRiskTag[];

/**
 * Rows this user is allowed to mutate: their own, plus the shared global
 * calendar (userId null) when they are an ADMIN.
 */
function writableScope(user: { id: string; role: string }) {
  return user.role === "ADMIN"
    ? { OR: [{ userId: user.id }, { userId: null }] }
    : { userId: user.id };
}

export async function saveEvent(form: FormData): Promise<void> {
  // userId comes from the session, never from the caller -- a client-supplied
  // id would let anyone write into another user's calendar.
  const user = await ensureUser();

  const id = optionalString(form, "id");

  const date = requiredString(form, "date", "Tarih");
  const time = requiredString(form, "time", "Saat");
  const dateTime = new Date(`${date}T${time}:00`);
  if (Number.isNaN(dateTime.getTime())) {
    throw new FormValidationError(`Tarih/saat geçersiz: "${date} ${time}".`);
  }

  const data = {
    dateTime,
    currency: requiredString(form, "currency", "Para birimi").toUpperCase(),
    eventName: requiredString(form, "eventName", "Etkinlik adı"),
    impact: requiredEnum(form, "impact", IMPACTS, "Etki"),
    userRiskTag: optionalEnum(form, "userRiskTag", RISK_TAGS, "Risk etiketi"),
    noTradeBeforeMinutes: optionalInt(form, "noTradeBefore", "İşlem yok (önce, dk)"),
    noTradeAfterMinutes: optionalInt(form, "noTradeAfter", "İşlem yok (sonra, dk)"),
    notes: optionalString(form, "notes"),
  };

  if (id) {
    // Scoped update: a guessed id belonging to someone else matches nothing
    // instead of overwriting their row. Global rows (userId null) are the
    // shared economic calendar -- only an ADMIN may edit those.
    await prisma.economicEvent.updateMany({
      where: { id, ...writableScope(user) },
      data,
    });
  } else {
    // Manual additions are always personal; the global calendar is seeded.
    await prisma.economicEvent.create({ data: { userId: user.id, ...data } });
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function deleteEvent(eventId: string): Promise<void> {
  const user = await ensureUser();
  await prisma.economicEvent.deleteMany({ where: { id: eventId, ...writableScope(user) } });
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}
