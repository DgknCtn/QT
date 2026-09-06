import { StatCard } from "@/components/ui-kit/stat-card";
import type { Performance } from "@/lib/risk/performance";
import type { computeAfterLoss } from "@/lib/risk/performance";
import { formatUsd } from "@/lib/money";

type AfterLoss = ReturnType<typeof computeAfterLoss>;

/**
 * Gerçek broker sonuçlarının teşhisi.
 *
 * Sayfanın geri kalanı manuel günlüğü (`Trade`) okuyor; bu panel içe
 * aktarılan gerçek pozisyonları (`BrokerTrade`) okuyor. İkisi bugüne kadar
 * hiç buluşmuyordu, ve analytics gerçek P&L'e kördü.
 *
 * Gösterilen metrikler bilerek kazanma oranının ötesinde: gerçek veride
 * kazanma oranı %65 iken hesap eriyordu, çünkü ortalama kayıp ortalama
 * kazancın 2.4 katıydı. Başabaş kazanma oranı bunu tek bakışta söylüyor.
 */
export function DiagnosticsPanel({
  perf,
  afterLoss,
}: {
  perf: Performance;
  afterLoss: AfterLoss;
}) {
  if (perf.count === 0) return null;

  const wr = perf.winRate! * 100;
  const be = perf.breakEvenWinRate != null ? perf.breakEvenWinRate * 100 : null;
  const shortfall = be != null ? be - wr : null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Gerçek sonuçlar
        </h2>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {perf.count} içe aktarılmış pozisyon · borsa verisi
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Beklenti / işlem"
          value={money(perf.expectancy!)}
          valueColor={perf.expectancy! >= 0 ? "var(--color-success)" : "var(--color-danger)"}
          sub={perf.expectancy! >= 0 ? "pozitif" : "her işlem ortalama bu kadar kaybettiriyor"}
        />
        <StatCard
          label="Payoff oranı"
          value={perf.payoff != null ? perf.payoff.toFixed(2) : "—"}
          valueColor={(perf.payoff ?? 0) >= 1 ? "var(--color-success)" : "var(--color-warning)"}
          sub={
            perf.avgWin != null && perf.avgLoss != null
              ? `ort. ${money(perf.avgWin)} / ${money(perf.avgLoss)}`
              : undefined
          }
        />
        <StatCard
          label="Kazanma oranı"
          value={`%${Math.round(wr)}`}
          sub={`${perf.wins}/${perf.count} kazanan`}
        />
        <StatCard
          label="Başabaş için gereken"
          value={be != null ? `%${Math.round(be)}` : "—"}
          valueColor={shortfall != null && shortfall > 0 ? "var(--color-danger)" : "var(--color-success)"}
          sub={
            shortfall == null
              ? undefined
              : shortfall > 0
                ? `${Math.round(shortfall)} puan eksik`
                : "eşiğin üstündesin"
          }
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="En uzun kayıp serisi"
          value={String(perf.maxConsecutiveLosses)}
          sub="üst üste"
        />
        <StatCard
          label="En kötü işlem"
          value={perf.worstTrade != null ? money(perf.worstTrade) : "—"}
          valueColor="var(--color-danger)"
        />
        <StatCard
          label="En kötü 5 işlem"
          value={money(perf.worst5Sum)}
          valueColor="var(--color-danger)"
          sub={
            perf.totalPnl < 0 && perf.worst5Sum < perf.totalPnl
              ? "bunlar olmasa hesap artıda"
              : "yoğunlaşma"
          }
        />
        <StatCard
          label="Kâr faktörü"
          value={perf.profitFactor != null ? perf.profitFactor.toFixed(2) : "—"}
          valueColor={(perf.profitFactor ?? 0) >= 1 ? "var(--color-success)" : "var(--color-danger)"}
        />
      </div>

      {afterLoss.count >= 3 && afterLoss.avgAfterLoss != null && afterLoss.avgOverall != null && (
        <div
          className="rounded-xl border px-4 py-3 flex flex-col gap-1"
          style={{
            background: afterLoss.avgAfterLoss < afterLoss.avgOverall
              ? "rgba(245,158,11,0.08)"
              : "var(--color-bg-elevated)",
            borderColor: afterLoss.avgAfterLoss < afterLoss.avgOverall
              ? "rgba(245,158,11,0.3)"
              : "var(--color-bg-border)",
          }}
        >
          <span className="text-xs font-semibold" style={{ color: "var(--color-warning)" }}>
            Büyük kayıptan sonra ne oluyor
          </span>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            ${afterLoss.threshold} üstü bir kayıp gerçekleştikten sonraki{" "}
            {afterLoss.windowMin / 60} saat içinde açtığın {afterLoss.count} işlemin
            ortalaması <strong style={{ color: "var(--color-danger)" }}>{money(afterLoss.avgAfterLoss)}</strong>.
            Genel ortalaman {money(afterLoss.avgOverall)}.
            {/* Iddianin gucu ornekleme bagli. Kucuk ornekte kesin konusmak,
                kullaniciyi olmayan bir kalibi duzeltmeye yonlendirir. */}
            {afterLoss.ratio != null && afterLoss.ratio > 1.5 && (
              <>
                {" "}Yaklaşık <strong>{afterLoss.ratio.toFixed(1)} kat</strong> kötü
                {afterLoss.count >= 20
                  ? " — zararın hangi setup'ta değil, hangi anda girdiğinle ilgili olduğuna işaret ediyor."
                  : ` — ancak ${afterLoss.count} işlem bir kalıp için az; eğilim olarak izle.`}
              </>
            )}
          </p>
          {afterLoss.unverifiable > 0 && (
            <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
              {afterLoss.unverifiable} işlem açılış anı bilinmediği için bu hesaba katılmadı.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function money(v: number) {
  return formatUsd(v, { signed: true });
}
