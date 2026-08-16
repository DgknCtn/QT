"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: catches errors thrown in the root layout itself.
 * It replaces the whole document, so the root layout's <html>/<body> and the
 * globals.css tokens are NOT available here -- everything is inlined on purpose.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0f",
          color: "#e8e8ea",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
            Uygulama başlatılamadı
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#9a9aa2", margin: "0 0 1.25rem" }}>
            Beklenmeyen bir hata oluştu. Sayfayı yenilemeyi dene; sorun sürerse
            biraz sonra tekrar dene.
          </p>
          {error.digest && (
            <p
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.6875rem",
                color: "#6f6f78",
                margin: "0 0 1.25rem",
              }}
            >
              Hata kodu: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              background: "#1a1a20",
              color: "#e8e8ea",
              border: "1px solid #2c2c34",
              borderRadius: "0.5rem",
              padding: "0.5rem 0.875rem",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  );
}
