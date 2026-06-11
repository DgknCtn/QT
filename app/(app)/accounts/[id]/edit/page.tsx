import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AccountForm } from "../../account-form";

export default async function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const account = await prisma.fundedAccount.findFirst({ where: { id, userId: user.id } });
  if (!account) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Hesap Düzenle</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {account.firmName} · Phase {account.phase}
        </p>
      </div>
      <div
        className="rounded-xl border p-6"
        style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
      >
        <AccountForm account={account} />
      </div>
    </div>
  );
}
