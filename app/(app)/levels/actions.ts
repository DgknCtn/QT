"use server";

import { revalidatePath } from "next/cache";
import { ensureUser, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { optionalDate, optionalString, requiredEnum, requiredNumber, requiredString } from "@/lib/schemas/form";
import type { LevelType, LevelStatus, MarketGroup, Timeframe } from "@prisma/client";

const MARKET_GROUPS = ["INDICES", "FOREX", "CRYPTO"] as const satisfies readonly MarketGroup[];
const LEVEL_STATUSES = ["ACTIVE", "INACTIVE", "REACHED"] as const satisfies readonly LevelStatus[];
const TIMEFRAMES = [
  "MONTHLY", "WEEKLY", "DAILY", "H4", "H1", "M90", "M15", "M5", "M1", "S15", "CUSTOM",
] as const satisfies readonly Timeframe[];
const LEVEL_TYPES = [
  "TYO", "TMO", "TWO", "TDO", "TSO", "TMSO", "PREV_HIGH", "PREV_LOW", "DFR_HIGH", "DFR_LOW",
  "DFR_MID", "DFR_PROJECTION", "FVG", "OB", "NWOG", "NDOG", "EQUAL_HIGHS", "EQUAL_LOWS",
  "CUSTOM_POI", "CUSTOM_TOI",
] as const satisfies readonly LevelType[];

export async function saveLevel(levelId: string | null, form: FormData) {
  const user = await ensureUser();

  const data = {
    userId:        user.id,
    instrument:    requiredString(form, "instrument", "Enstrüman").toUpperCase(),
    marketGroup:   requiredEnum(form, "marketGroup", MARKET_GROUPS, "Piyasa grubu"),
    levelType:     requiredEnum(form, "levelType", LEVEL_TYPES, "Seviye tipi"),
    price:         requiredNumber(form, "price", "Fiyat"),
    timeframe:     requiredEnum(form, "timeframe", TIMEFRAMES, "Zaman dilimi"),
    status:        requiredEnum(form, "status", LEVEL_STATUSES, "Durum"),
    dateValidFrom: optionalDate(form, "dateValidFrom", "Geçerlilik başlangıcı"),
    dateValidTo:   optionalDate(form, "dateValidTo", "Geçerlilik bitişi"),
    notes:         optionalString(form, "notes"),
  };

  if (levelId) {
    await prisma.level.update({ where: { id: levelId, userId: user.id }, data });
  } else {
    await prisma.level.create({ data });
  }
  revalidatePath("/levels");
}

export async function deleteLevel(levelId: string) {
  const user = await getSessionUser();
  await prisma.level.delete({ where: { id: levelId, userId: user.id } });
  revalidatePath("/levels");
}

export async function toggleLevelStatus(levelId: string, current: LevelStatus) {
  const user = await getSessionUser();

  const next: LevelStatus = current === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await prisma.level.update({
    where: { id: levelId, userId: user.id },
    data:  { status: next },
  });
  revalidatePath("/levels");
}
