import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlaybookForm } from "../../playbook-form";

export default async function EditPlaybookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entry = await prisma.playbookEntry.findFirst({ where: { id, userId: user.id } });
  if (!entry) notFound();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <Link href={`/playbook/${id}`} className="inline-flex items-center gap-1.5 text-xs hover:underline"
        style={{ color: "var(--color-text-muted)" }}>
        <ArrowLeft size={12} /> Geri
      </Link>
      <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Setup Düzenle</h1>
      <PlaybookForm entry={entry} userId={user.id} />
    </div>
  );
}
