import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlaybookForm } from "../playbook-form";

export default async function NewPlaybookPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <Link href="/playbook" className="inline-flex items-center gap-1.5 text-xs hover:underline"
        style={{ color: "var(--color-text-muted)" }}>
        <ArrowLeft size={12} /> Playbook&apos;a Dön
      </Link>
      <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Yeni Setup</h1>
      <PlaybookForm userId={user.id} />
    </div>
  );
}
