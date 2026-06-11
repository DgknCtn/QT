import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { saveLesson } from "../../../../../actions";

export default async function NewLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ chapterId?: string }>;
}) {
  const { id } = await params;
  const { chapterId } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") redirect("/mentorship");

  if (!chapterId) redirect(`/mentorship/admin/courses/${id}`);

  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) redirect(`/mentorship/admin/courses/${id}`);

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/mentorship/admin/courses/${id}`} className="text-xs" style={{ color: "var(--color-text-muted)" }}>← Kursa Dön</Link>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Yeni Ders</h1>
      </div>
      <p className="text-sm -mt-3" style={{ color: "var(--color-text-muted)" }}>Bölüm: {chapter.title}</p>

      <form action={saveLesson} className="space-y-4">
        <input type="hidden" name="chapterId" value={chapterId} />
        <input type="hidden" name="courseId" value={id} />

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Ders Başlığı *</label>
          <input name="title" required placeholder="Ders başlığı"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Video URL (YouTube, Vimeo vb.)</label>
          <input name="videoUrl" type="url" placeholder="https://..."
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Doküman / PDF URL (Drive, Notion vb.)</label>
          <input name="documentUrl" type="url" placeholder="https://..."
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Açıklama / Notlar (Markdown)</label>
          <textarea name="content" rows={8} placeholder="Ders içeriği, notlar..."
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-y"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
        </div>

        <div className="flex items-center gap-2">
          <input name="isPublished" type="checkbox" id="pub" value="true" defaultChecked className="rounded" />
          <label htmlFor="pub" className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Hemen yayınla</label>
        </div>

        <div className="flex gap-3">
          <button type="submit"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: "var(--color-accent)", color: "#fff" }}>
            Kaydet
          </button>
          <Link href={`/mentorship/admin/courses/${id}`}
            className="px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-bg-border)" }}>
            İptal
          </Link>
        </div>
      </form>
    </div>
  );
}
