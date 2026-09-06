"use client";

import { useActionState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { saveRiskLimits } from "./actions";

/**
 * Risk Guard limitleri.
 *
 * Sayfadaki diğer tercihlerden farklı olarak bunlar Supabase
 * `user_metadata`'ya değil `User` tablosuna yazılıyor — dashboard'un
 * sunucu tarafında okuyabilmesi gerekiyor.
 */
export function RiskLimitsForm({
  initialDailyLoss,
  initialMaxStreak,
}: {
  initialDailyLoss: number;
  initialMaxStreak: number;
}) {
  const [state, action, pending] = useActionState(saveRiskLimits, { error: "", success: false });

  return (
    <form id="risk-guard" action={action} className="card p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} style={{ color: "var(--color-accent)" }} aria-hidden="true" />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Risk Guard
        </h2>
      </div>

      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        Gün içi durma kuralı. Limit aşıldığında dashboard uyarır ve günü kapatır.
        Kuralı kapatmak için 0 yaz. <strong>Dashboard&apos;daki &ldquo;günlük risk limiti
        tanımlı değil&rdquo; uyarısını kaldıran yer burasıdır</strong> — yukarıdaki
        yüzde alanları değil.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="step-label">Günlük zarar limiti ($)</span>
          <input
            name="dailyLossLimitUsd"
            type="number"
            step="10"
            min="0"
            defaultValue={initialDailyLoss}
            className="field-input"
          />
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Bugünkü net zarar bu değere ulaşınca dur.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="step-label">Ardışık kayıp sınırı</span>
          <input
            name="maxConsecutiveLosses"
            type="number"
            step="1"
            min="0"
            max="20"
            defaultValue={initialMaxStreak}
            className="field-input"
          />
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Üst üste bu kadar kaybedince dur.
          </span>
        </label>
      </div>

      {state.error && (
        <p className="text-xs" style={{ color: "var(--color-danger)" }} role="alert">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs" style={{ color: "var(--color-success)" }} role="status">Kaydedildi.</p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          {pending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          Limitleri kaydet
        </button>
      </div>
    </form>
  );
}
