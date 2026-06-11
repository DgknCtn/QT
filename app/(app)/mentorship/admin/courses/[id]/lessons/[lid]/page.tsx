import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { saveLesson } from "../../../../../actions";

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string; lid: string }>;
}) {
  const { id, lid } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") redirect("/mentorship");

  const lesson = await prisma.lesson.findUnique({ where: { id: lid } });
  if (!lesson) notFound();

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/mentorship/admin/courses/${id}`} className="text-xs" style={{ color: "var(--color-text-muted)" }}>← Kursa Dön</Link>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Dersi Düzenle</h1>
      </div>

      <form action={saveLesson} className="space-y-4">
        <input type="hidden" name="id" value={lid} />
        <input type="hidden" name="chapterId" value={lesson.chapterId} />
        <input type="hidden" name="courseId" value={id} />

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Ders Başlığı *</label>
          <input name="title" required defaultValue={lesson.title}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Video URL</label>
          <input name="videoUrl" type="url" defaultValue={lesson.videoUrl ?? ""}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Doküman URL</label>
          <input name="documentUrl" type="url" defaultValue={lesson.documentUrl ?? ""}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Açıklama / Notlar</label>
          <textarea name="content" rows={8} defaultValue={lesson.content ?? ""}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-y"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-bg-border)", color: "var(--color-text-primary)" }} />
        </div>

        <div className="flex items-center gap-2">
          <input name="isPublished" type="checkbox" id="pub" value="true" defaultChecked={lesson.isPublished} className="rounded" />
          <label htmlFor="pub" className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Yayınlanmış</label>
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
