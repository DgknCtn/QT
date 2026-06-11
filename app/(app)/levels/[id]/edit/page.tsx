import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { LevelForm } from "../../level-form";

export default async function EditLevelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const level = await prisma.level.findFirst({ where: { id, userId: user.id } });
  if (!level) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Level Düzenle</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {level.instrument} · {level.levelType} @ {level.price}
        </p>
      </div>
      <div
        className="rounded-xl border p-6"
        style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
      >
        <LevelForm level={level} />
      </div>
    </div>
  );
}
