"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Capture install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      const dismissed = localStorage.getItem("qt-pwa-dismissed");
      if (!dismissed) setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      setPrompt(null);
    }
  }

  function dismiss() {
    setDismissed(true);
    localStorage.setItem("qt-pwa-dismissed", "1");
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg"
      style={{
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-bg-border)",
        maxWidth: 300,
      }}
    >
      <Download size={16} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>Uygulamayı yükle</p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>QT Workspace&apos;i ana ekrana ekle</p>
      </div>
      <button
        onClick={install}
        className="px-3 py-1 rounded-lg text-xs font-medium shrink-0"
        style={{ background: "var(--color-accent)", color: "#fff" }}
      >
        Yükle
      </button>
      <button
        onClick={dismiss}
        className="p-1 rounded"
        style={{ color: "var(--color-text-muted)" }}
      >
        <X size={12} />
      </button>
    </div>
  );
}
