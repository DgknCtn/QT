import { prisma } from "@/lib/prisma";
import { KnowledgeShell } from "./knowledge-shell";

export default async function KnowledgePage() {
  const concepts = await prisma.concept.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
    select: { id: true, title: true, category: true, definition: true, confidenceLevel: true, isSystemConcept: true },
  }).catch(() => []);

  return <KnowledgeShell concepts={concepts as any} />;
}
