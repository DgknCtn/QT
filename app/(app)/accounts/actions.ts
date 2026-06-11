"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { AccountStatus } from "@/app/generated/prisma/client";

async function ensureUser(userId: string, email: string) {
  await prisma.user.upsert({
    where:  { id: userId },
    update: {},
    create: { id: userId, email },
  });
}

export async function saveAccount(accountId: string | null, form: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await ensureUser(user.id, user.email ?? "");

  const data = {
    userId:          user.id,
    firmName:        (form.get("firmName") as string).trim(),
    phase:           parseInt(form.get("phase") as string, 10),
    accountId:       (form.get("accountId") as string) || null,
    startingBalance: parseFloat(form.get("startingBalance") as string),
    currentEquity:   parseFloat(form.get("currentEquity") as string),
    profitTarget:    parseFloat(form.get("profitTarget") as string),
    maxDailyLoss:    parseFloat(form.get("maxDailyLoss") as string),
    maxTotalLoss:    parseFloat(form.get("maxTotalLoss") as string),
    status:          (form.get("status") as AccountStatus) || "ACTIVE",
    startDate:       new Date(form.get("startDate") as string),
    endDate:         form.get("endDate") ? new Date(form.get("endDate") as string) : null,
    notes:           (form.get("notes") as string) || null,
  };

  if (accountId) {
    await prisma.fundedAccount.update({ where: { id: accountId, userId: user.id }, data });
  } else {
    await prisma.fundedAccount.create({ data });
  }
  revalidatePath("/accounts");
}

export async function deleteAccount(accountId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await prisma.fundedAccount.delete({ where: { id: accountId, userId: user.id } });
  revalidatePath("/accounts");
}

export async function logEquity(accountId: string, form: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const account = await prisma.fundedAccount.findFirst({ where: { id: accountId, userId: user.id } });
  if (!account) throw new Error("Account not found");

  const equity   = parseFloat(form.get("equity") as string);
  const pnlToday = form.get("pnlToday") ? parseFloat(form.get("pnlToday") as string) : null;
  const note     = (form.get("note") as string) || null;

  await prisma.$transaction([
    prisma.equityLog.create({ data: { accountId, equity, pnlToday, note } }),
    prisma.fundedAccount.update({ where: { id: accountId }, data: { currentEquity: equity } }),
  ]);
  revalidatePath("/accounts");
}
