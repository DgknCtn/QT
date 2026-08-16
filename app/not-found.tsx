import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <Compass size={32} className="text-muted" aria-hidden="true" />

      <div className="space-y-1.5">
        <h1 className="text-primary text-lg font-semibold">Sayfa bulunamadı</h1>
        <p className="text-muted max-w-md text-sm">
          Aradığın sayfa taşınmış veya hiç var olmamış olabilir.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="hover-surface bg-surface border-app text-primary rounded-lg border px-3 py-1.5 text-sm"
      >
        Dashboard&apos;a dön
      </Link>
    </div>
  );
}
