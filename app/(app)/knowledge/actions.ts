"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ConceptCategory, ConfidenceLevel } from "@prisma/client";

/**
 * Concept content is shared and curated, so writes are admin-only. The per-user
 * learning state (`confidenceLevel`, `userNotes`) lives in `ConceptProgress`
 * and is edited separately -- see `updateConfidence` and `saveMyNotes`.
 */
export async function saveConcept(form: FormData): Promise<string> {
  await requireAdmin();

  const id = form.get("id") as string | null;
  const content = {
    title: form.get("title") as string,
    category: form.get("category") as ConceptCategory,
    definition: (form.get("definition") as string) || null,
    whyItMatters: (form.get("whyItMatters") as string) || null,
    whenToUse: (form.get("whenToUse") as string) || null,
    whenNotToUse: (form.get("whenNotToUse") as string) || null,
    requiredConditions: (form.get("requiredConditions") as string) || null,
    commonMistakes: (form.get("commonMistakes") as string) || null,
  };

  const concept = id
    ? await prisma.concept.update({ where: { id }, data: content })
    : await prisma.concept.create({ data: content });

  revalidatePath("/knowledge");
  revalidatePath(`/knowledge/${concept.id}`);
  return concept.id;
}

/**
 * Personal notes belong to whoever is signed in, so this needs a session but
 * not admin -- every user keeps their own notes on the shared concept.
 */
export async function saveMyNotes(conceptId: string, notes: string): Promise<void> {
  const userId = await requireUserId();
  const userNotes = notes.trim() || null;

  await prisma.conceptProgress.upsert({
    where: { userId_conceptId: { userId, conceptId } },
    update: { userNotes },
    create: { userId, conceptId, userNotes },
  });

  revalidatePath(`/knowledge/${conceptId}`);
}

export async function updateConfidence(conceptId: string, level: ConfidenceLevel): Promise<void> {
  const userId = await requireUserId();

  await prisma.conceptProgress.upsert({
    where: { userId_conceptId: { userId, conceptId } },
    update: { confidenceLevel: level },
    create: { userId, conceptId, confidenceLevel: level },
  });

  revalidatePath("/knowledge");
  revalidatePath(`/knowledge/${conceptId}`);
}

export async function deleteConcept(conceptId: string): Promise<void> {
  await requireAdmin();
  // ConceptProgress rows cascade with the concept.
  await prisma.concept.delete({ where: { id: conceptId } });
  revalidatePath("/knowledge");
}
