"use server";

import { revalidatePath } from "next/cache";
import { ensureUser, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  optionalDate,
  optionalString,
  requiredDate,
  requiredEnum,
  requiredInt,
  requiredNumber,
  requiredString,
} from "@/lib/schemas/form";
import type { AccountStatus } from "@prisma/client";

const ACCOUNT_STATUSES = ["ACTIVE", "PASSED", "FAILED", "REVIEW"] as const satisfies readonly AccountStatus[];

export async function saveAccount(accountId: string | null, form: FormData) {
  const user = await ensureUser();

  // Validated rather than cast: a blank money field used to become NaN and fail
  // deep inside Prisma with an opaque message.
  const data = {
    userId:          user.id,
    firmName:        requiredString(form, "firmName", "Firma adı"),
    phase:           requiredInt(form, "phase", "Faz"),
    accountId:       optionalString(form, "accountId"),
    startingBalance: requiredNumber(form, "startingBalance", "Başlangıç bakiyesi"),
    currentEquity:   requiredNumber(form, "currentEquity", "Güncel bakiye"),
    profitTarget:    requiredNumber(form, "profitTarget", "Kâr hedefi"),
    maxDailyLoss:    requiredNumber(form, "maxDailyLoss", "Maks. günlük zarar"),
    maxTotalLoss:    requiredNumber(form, "maxTotalLoss", "Maks. toplam zarar"),
    status:          requiredEnum(form, "status", ACCOUNT_STATUSES, "Durum"),
    startDate:       requiredDate(form, "startDate", "Başlangıç tarihi"),
    endDate:         optionalDate(form, "endDate", "Bitiş tarihi"),
    notes:           optionalString(form, "notes"),
  };

  if (accountId) {
    await prisma.fundedAccount.update({ where: { id: accountId, userId: user.id }, data });
  } else {
    await prisma.fundedAccount.create({ data });
  }
  revalidatePath("/accounts");
}

export async function deleteAccount(accountId: string) {
  const user = await getSessionUser();
  await prisma.fundedAccount.delete({ where: { id: accountId, userId: user.id } });
  revalidatePath("/accounts");
}

export async function advancePhase(accountId: string) {
  const user = await getSessionUser();

  const account = await prisma.fundedAccount.findFirst({ where: { id: accountId, userId: user.id } });
  if (!account) throw new Error("Account not found");

  if (account.phase === 1) {
    await prisma.fundedAccount.update({
      where: { id: accountId },
      data: {
        phase: 2,
        phase2StartBalance: account.currentEquity,
        profitTarget: account.currentEquity * 0.04,
      },
    });
  } else if (account.phase === 2) {
    await prisma.fundedAccount.update({
      where: { id: accountId },
      data: { phase: 3, status: "PASSED" },
    });
  }
  revalidatePath("/accounts");
}

export async function logEquity(accountId: string, form: FormData) {
  const user = await getSessionUser();

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
