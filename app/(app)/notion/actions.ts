"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") throw new Error("Not authorized");
}

export async function saveNotionPage(formData: FormData) {
  await requireAdmin();
  const id       = (formData.get("id") as string) || null;
  const title    = formData.get("title") as string;
  const url      = formData.get("url") as string;
  const category = (formData.get("category") as string) || null;
  const emoji    = (formData.get("emoji") as string) || null;

  if (id) {
    await prisma.notionPage.update({ where: { id }, data: { title, url, category, emoji } });
  } else {
    const max = await prisma.notionPage.aggregate({ _max: { order: true } });
    await prisma.notionPage.create({ data: { title, url, category, emoji, order: (max._max.order ?? 0) + 1 } });
  }
  revalidatePath("/notion");
}

export async function deleteNotionPage(id: string) {
  await requireAdmin();
  await prisma.notionPage.delete({ where: { id } });
  revalidatePath("/notion");
}
