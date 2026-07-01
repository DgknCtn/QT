import { Loader2 } from "lucide-react";

export function PageLoading() {
  return (
    <div className="flex items-center justify-center py-24" aria-label="Yükleniyor" role="status">
      <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-text-muted)" }} />
    </div>
  );
}

export default PageLoading;
