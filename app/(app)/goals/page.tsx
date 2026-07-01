import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { GoalsPanel } from "./goals-panel";

export default async function GoalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email ?? "" },
  });

  return (
    <div className="max-w-3xl mx-auto">
      <GoalsPanel userId={user.id} />
    </div>
  );
}
