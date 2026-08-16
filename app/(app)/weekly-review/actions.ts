"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveWeeklyReview(
  weekStart: string,
  data: {
    wentWell: string;
    toImprove: string;
    nextFocus: string;
    commitment: string;
    overallRating: number | null;
  }
) {
  const user = await getSessionUser();

  await prisma.weeklyReview.upsert({
    where: { userId_weekStart: { userId: user.id, weekStart: new Date(weekStart) } },
    update: {
      wentWell:      data.wentWell.trim()    || null,
      toImprove:     data.toImprove.trim()   || null,
      nextFocus:     data.nextFocus.trim()   || null,
      commitment:    data.commitment.trim()  || null,
      overallRating: data.overallRating,
    },
    create: {
      userId:        user.id,
      weekStart:     new Date(weekStart),
      wentWell:      data.wentWell.trim()    || null,
      toImprove:     data.toImprove.trim()   || null,
      nextFocus:     data.nextFocus.trim()   || null,
      commitment:    data.commitment.trim()  || null,
      overallRating: data.overallRating,
    },
  });

  revalidatePath("/weekly-review");
}
