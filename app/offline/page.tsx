import { WifiOff } from "lucide-react";

export const metadata = { title: "Çevrimdışı · QT" };

/**
 * Offline fallback served by the service worker when a navigation fails and
 * nothing suitable is cached. Must stay fully static and dependency-free --
 * it has to render with no network and no session.
 */
export default function OfflinePage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: "var(--color-bg-base)" }}
    >
      <WifiOff size={32} style={{ color: "var(--color-text-muted)" }} aria-hidden="true" />

      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Bağlantı yok
        </h1>
        <p className="max-w-md text-sm" style={{ color: "var(--color-text-muted)" }}>
          İnternet bağlantın kesildi. Daha önce açtığın sayfalar önbellekten
          çalışmaya devam edebilir; bu sayfa yeniden bağlandığında güncellenecek.
        </p>
      </div>
    </div>
  );
}
