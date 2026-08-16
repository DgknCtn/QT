import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { KnowledgeShell } from "./knowledge-shell";

export default async function KnowledgePage() {
  const userId = await requireUserId();

  const concepts = await prisma.concept.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      category: true,
      definition: true,
      isSystemConcept: true,
      // Only this user's learning state -- the concept row itself is shared.
      progress: {
        where: { userId },
        select: { confidenceLevel: true },
        take: 1,
      },
    },
  });

  const shaped = concepts.map(({ progress, ...c }) => ({
    ...c,
    confidenceLevel: progress[0]?.confidenceLevel ?? "NEW",
  }));

  return <KnowledgeShell concepts={shaped} />;
}
