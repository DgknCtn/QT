"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function savePlaybook(
  id: string | null,
  data: {
    title: string;
    category: string;
    description: string;
    conditions: string[];
    management: string[];
    invalidation: string[];
    notes: string;
    imageUrls: string[];
    isActive: boolean;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const payload = {
    userId: user.id,
    title: data.title.trim(),
    category: data.category.trim(),
    description: data.description.trim() || null,
    conditions: data.conditions.filter(Boolean),
    management: data.management.filter(Boolean),
    invalidation: data.invalidation.filter(Boolean),
    notes: data.notes.trim() || null,
    imageUrls: data.imageUrls,
    isActive: data.isActive,
  };

  let entryId = id;
  if (id) {
    await prisma.playbookEntry.update({ where: { id, userId: user.id }, data: payload });
  } else {
    const entry = await prisma.playbookEntry.create({ data: payload });
    entryId = entry.id;
  }

  revalidatePath("/playbook");
  redirect(`/playbook/${entryId}`);
}

export async function deletePlaybook(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.playbookEntry.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/playbook");
  redirect("/playbook");
}
