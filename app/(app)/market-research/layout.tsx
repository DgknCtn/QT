import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Radar } from "lucide-react";
import { TabNav } from "@/components/market-research/tab-nav";

// All Market Research pages are per-request/DB-driven (archive data changes as
// imports run) -- never statically prerender at build time.
export const dynamic = "force-dynamic";

export default async function MarketResearchLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const dbUser = user ? await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } }) : null;

  return (
    <div className="space-y-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <Radar size={18} style={{ color: "var(--color-accent)" }} />
          <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Market Research</h1>
        </div>
        <TabNav isAdmin={dbUser?.role === "ADMIN"} />
      </div>
      {children}
    </div>
  );
}
