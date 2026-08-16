"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, TriangleAlert } from "lucide-react";

/**
 * Route-level error boundary. Catches render/data errors thrown anywhere below
 * the root layout and offers a recovery path instead of Next's bare error page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // No telemetry sink wired up yet -- at least surface it in the console so
    // the failure isn't completely invisible in production.
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <TriangleAlert size={32} className="text-warning" aria-hidden="true" />

      <div className="space-y-1.5">
        <h1 className="text-primary text-lg font-semibold">Bir şeyler ters gitti</h1>
        <p className="text-muted max-w-md text-sm">
          Bu sayfa yüklenirken beklenmeyen bir hata oluştu. Tekrar denemek sorunu
          çözmezse dashboard&apos;a dönebilirsin.
        </p>
        {error.digest && (
          <p className="text-muted font-mono text-[11px]">Hata kodu: {error.digest}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={reset}
          className="hover-surface bg-surface border-app text-primary inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm"
        >
          <RotateCw size={14} aria-hidden="true" />
          Tekrar dene
        </button>
        <Link
          href="/dashboard"
          className="hover-surface text-muted rounded-lg px-3 py-1.5 text-sm"
        >
          Dashboard&apos;a dön
        </Link>
      </div>
    </div>
  );
}
