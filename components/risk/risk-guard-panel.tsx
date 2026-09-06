import Link from "next/link";
import { ShieldCheck, ShieldAlert, Ban, PlugZap } from "lucide-react";
import type { GuardState } from "@/lib/risk/guard";
import type { DataStatus } from "@/lib/data-quality";
import { formatUsd } from "@/lib/money";

/**
 * Gün içi durma durumu — dashboard'un en üstünde.
 *
 * Uygulamanın geri kalanı işleme girmeden ÖNCEKİ disiplini ölçüyor
 * (Daily Prep, GO/NO-GO). Bu panel girdikten sonrakini ölçüyor, çünkü
 * gerçek veride para orada kaybediliyordu.
 */
/** "Son islem: 14:32" gibi kisa bir kapsam etiketi. */
function formatCoverage(d: Date): string {
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (sameDay) return `bugün ${hhmm}`;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")} ${hhmm}`;
}

export function RiskGuardPanel({
  state,
  dataStatus = "ok",
  coveredUntil = null,
}: {
  state: GuardState;
  /** Guard verisinin durumu. `error` iken hicbir guvenli durum gosterilmez. */
  dataStatus?: DataStatus;
  /** Verinin kapsadigi son an — CSV ile beslenen veride kritik. */
  coveredUntil?: Date | null;
}) {
  // Veri alinamadiginda panel "Gun acik" DEMEZ. Bos liste ile basarisiz sorgu
  // ayni sonucu uretiyordu: sifir P&L, sifir ardisik kayip, yesil durum.
  if (dataStatus === "error") {
    return (
      <div
        className="flex items-center gap-2.5 rounded-xl border px-4 py-3"
        style={{ borderColor: "var(--color-warning)", background: "var(--color-bg-elevated)" }}
      >
        <PlugZap size={16} style={{ color: "var(--color-warning)" }} aria-hidden="true" />
        <span className="text-sm font-semibold" style={{ color: "var(--color-warning)" }}>
          Risk verisi alınamadı
        </span>
        <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          Gün durumu bilinmiyor — bu &ldquo;işlem yok&rdquo; anlamına gelmez.
        </span>
      </div>
    );
  }

  if (state.disabled) {
    return (
      <Link
        href="/settings"
        className="flex items-center gap-2.5 rounded-xl border px-4 py-3 transition-colors hover-surface"
        style={{ borderColor: "var(--color-bg-border)", background: "var(--color-bg-elevated)" }}
      >
        <ShieldAlert size={16} style={{ color: "var(--color-text-muted)" }} aria-hidden="true" />
        <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Günlük risk limiti tanımlı değil
        </span>
        <span className="text-xs ml-auto" style={{ color: "var(--color-accent)" }}>
          Ayarla →
        </span>
      </Link>
    );
  }

  const stopped = state.shouldStop;
  const accent = stopped
    ? "var(--color-danger)"
    : (state.usedRatio ?? 0) >= 0.6
      ? "var(--color-warning)"
      : "var(--color-success)";

  const Icon = stopped ? Ban : ShieldCheck;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: stopped ? accent : "var(--color-bg-border)",
        background: "var(--color-bg-elevated)",
      }}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color: accent }} aria-hidden="true" />
          <span className="text-sm font-semibold" style={{ color: accent }}>
            {stopped ? "Bugün bitti" : "Gün açık"}
          </span>
        </div>

        <Stat label="Bugünkü P&L" value={money(state.todayPnl)} color={pnlColor(state.todayPnl)} />

        {/* Son import'tan sonraki islemler sistemde yok; kullanici panelin
            neyi kapsadigini gormeli. */}
        <Stat
          label="Veri kapsamı"
          value={coveredUntil ? formatCoverage(coveredUntil) : "içe aktarma yok"}
          color="var(--color-text-muted)"
        />

        {state.remainingUsd != null && (
          <Stat
            label="Limite kalan"
            value={`$${state.remainingUsd.toFixed(0)}`}
            color={stopped ? "var(--color-danger)" : "var(--color-text-primary)"}
          />
        )}

        <Stat
          label="Ardışık kayıp"
          value={String(state.consecutiveLosses)}
          color={state.consecutiveLosses > 0 ? "var(--color-warning)" : "var(--color-text-primary)"}
        />

        <Stat label="Pozisyon" value={String(state.todayCount)} color="var(--color-text-primary)" />
      </div>

      {state.usedRatio != null && (
        <div className="h-1" style={{ background: "var(--color-bg-surface)" }} role="presentation">
          <div className="h-full transition-all" style={{ width: `${state.usedRatio * 100}%`, background: accent }} />
        </div>
      )}

      {stopped && (
        <p className="px-4 py-2.5 text-xs" style={{ background: "rgba(239,68,68,0.09)", color: "var(--color-danger)" }}>
          {state.breaches.includes("DAILY_LOSS") && "Günlük zarar limitine ulaşıldı. "}
          {state.breaches.includes("CONSECUTIVE_LOSSES") &&
            `${state.consecutiveLosses} işlemdir üst üste kaybediyorsun. `}
          Bugün yeni pozisyon açma — gerçek verinde zararın büyük kısmı tam bu noktadan sonra geldi.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <span className="text-sm font-mono font-semibold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

function money(v: number) {
  return formatUsd(v, { signed: true });
}

function pnlColor(v: number) {
  if (v > 0) return "var(--color-success)";
  if (v < 0) return "var(--color-danger)";
  return "var(--color-text-primary)";
}
