import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ConceptForm } from "../../concept-form";

export default async function EditConceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Shared content only -- personal notes and confidence are edited per-user
  // from the concept detail page, not from this admin form.
  const concept = await prisma.concept.findUnique({ where: { id } });
  if (!concept) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <ConceptForm concept={concept} />
    </div>
  );
}
