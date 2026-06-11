import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { saveNotionPage } from "./actions";
import { NotionHub } from "./notion-embed";
import { Plus } from "lucide-react";

export default async function NotionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser  = await prisma.user.findUnique({ where: { id: user.id } });
  const isAdmin = dbUser?.role === "ADMIN";

  const pages = await prisma.notionPage.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="p-6 max-w-5xl space-y-8">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Notion</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Notion sayfaların burada — üzerine tıkla
        </p>
      </div>

      {/* Admin: add form */}
      {isAdmin && (
        <div className="rounded-xl p-5 border" style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Sayfa Ekle</h2>
          <form action={saveNotionPage} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input name="title" required placeholder="Sayfa başlığı"
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
              <input name="url" type="url" required placeholder="https://...notion.site/..."
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input name="category" placeholder="Kategori (ör: Setups, Eğitim, Rutin)"
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
              <input name="emoji" placeholder="Emoji (ör: 📊 📚 ✅)"
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
            </div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              💡 Notion sayfasında <strong>"Share → Share to web"</strong> aç, üretilen <code>notion.site</code> linkini kullan.
            </div>
            <button type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "var(--color-accent)", color: "#fff" }}>
              <Plus size={14} /> Ekle
            </button>
          </form>
        </div>
      )}

      <NotionHub pages={pages} isAdmin={isAdmin} />
    </div>
  );
}
