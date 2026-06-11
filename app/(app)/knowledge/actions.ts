"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ConceptCategory, ConfidenceLevel } from "@prisma/client";

export async function saveConcept(form: FormData): Promise<string> {
  const id = form.get("id") as string | null;
  const data = {
    title: form.get("title") as string,
    category: form.get("category") as ConceptCategory,
    definition: (form.get("definition") as string) || null,
    whyItMatters: (form.get("whyItMatters") as string) || null,
    whenToUse: (form.get("whenToUse") as string) || null,
    whenNotToUse: (form.get("whenNotToUse") as string) || null,
    requiredConditions: (form.get("requiredConditions") as string) || null,
    commonMistakes: (form.get("commonMistakes") as string) || null,
    userNotes: (form.get("userNotes") as string) || null,
    confidenceLevel: (form.get("confidenceLevel") as ConfidenceLevel) ?? "NEW",
  };

  let concept;
  if (id) {
    concept = await prisma.concept.update({ where: { id }, data });
  } else {
    concept = await prisma.concept.create({ data });
  }

  revalidatePath("/knowledge");
  revalidatePath(`/knowledge/${concept.id}`);
  return concept.id;
}

export async function updateConfidence(conceptId: string, level: ConfidenceLevel): Promise<void> {
  await prisma.concept.update({ where: { id: conceptId }, data: { confidenceLevel: level } });
  revalidatePath("/knowledge");
  revalidatePath(`/knowledge/${conceptId}`);
}

export async function deleteConcept(conceptId: string): Promise<void> {
  await prisma.concept.delete({ where: { id: conceptId } });
  revalidatePath("/knowledge");
}
