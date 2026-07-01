import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ResourcesBrowser } from "./resources-browser";

export default async function MenteeResourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, include: { menteeProfile: true } });
  const isAdmin = dbUser?.role === "ADMIN";
  if (!isAdmin && (!dbUser?.menteeProfile || dbUser.menteeProfile.status !== "ACTIVE")) redirect("/mentorship");

  const resources = await prisma.resource.findMany({
    orderBy: { order: "asc" },
    select: { id: true, title: true, description: true, type: true, url: true, category: true },
  });

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/mentorship" className="text-xs text-muted">← Mentorship</Link>
        <h1 className="text-xl font-bold text-primary">Kaynak Kütüphanesi</h1>
      </div>

      {resources.length === 0 ? (
        <p className="text-sm text-muted">Henüz kaynak eklenmemiş.</p>
      ) : (
        <ResourcesBrowser resources={resources} />
      )}
    </div>
  );
}
