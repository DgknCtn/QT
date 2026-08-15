import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ImportRunErrorDetail } from "./import-run-error-detail";

export default async function MarketResearchImportAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const dbUser = user ? await prisma.user.findUnique({ where: { id: user.id } }) : null;

  if (dbUser?.role !== "ADMIN") {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    );
  }

  const runs = await prisma.marketImportRun.findMany({ orderBy: { startedAt: "desc" }, take: 20 });
  const totalImported = runs.reduce((n, r) => n + r.imported, 0);
  const totalErrors = runs.reduce((n, r) => n + r.errors, 0);
  const lastRun = runs[0];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Import Runs</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Discord export importları buradan başlatılmaz -- şu komutla çalıştırılır:
        </p>
        <pre
          className="text-xs mt-2 p-2 rounded-lg overflow-x-auto"
          style={{ background: "var(--color-bg-surface)", color: "var(--color-text-secondary)" }}
        >
npx tsx scripts/discord-import/run.ts --input &lt;export-klasörü&gt;
        </pre>
      </div>

      {runs.length > 0 && (
        <div className="flex gap-6">
          {[
            { label: "Toplam çalıştırma", value: runs.length },
            { label: "Toplam içe aktarılan", value: totalImported },
            { label: "Toplam hata", value: totalErrors },
            { label: "Son durum", value: lastRun.status.toUpperCase() },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</p>
              <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {runs.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Henüz import çalıştırılmadı.</p>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <div
              key={run.id}
              className="rounded-xl border p-3"
              style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {format(run.startedAt, "d MMM yyyy HH:mm")}
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{
                    background:
                      run.status === "completed" ? "rgba(52,201,126,0.15)" : run.status === "failed" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                    color: run.status === "completed" ? "var(--color-success)" : run.status === "failed" ? "var(--color-danger)" : "var(--color-warning)",
                  }}
                >
                  {run.status.toUpperCase()}
                </span>
              </div>
              <div className="flex gap-4 mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                <span>Dosya: {run.filesDone}/{run.filesTotal}</span>
                <span>İçe aktarılan: {run.imported}</span>
                <span>Duplicate: {run.duplicates}</span>
                <span style={{ color: run.errors > 0 ? "var(--color-danger)" : undefined }}>Hata: {run.errors}</span>
              </div>
              <ImportRunErrorDetail errorDetail={run.errorDetail as { file: string; reason: string }[] | null} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
