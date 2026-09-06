"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Link2, Link2Off, Loader2, Search } from "lucide-react";
import { getMatchCandidates, linkBrokerTradeToJournal } from "../actions";
import type { ScoredCandidate } from "@/lib/broker/match";

/**
 * Broker pozisyonunu manuel journal kaydına bağlayan arayüz.
 *
 * Aday listesi otomatik sıralanır ama bağlama otomatik yapılmaz: yanlış
 * eşleşmiş bir pozisyon, hiç eşleşmemiş olandan kötüdür — sonrasındaki bütün
 * analizi sessizce bozar. Öneri sistemin, karar kullanıcının.
 */
export function JournalLink({
  brokerTradeId,
  linked,
}: {
  brokerTradeId: string;
  /** Halihazirda bagli journal kaydi. */
  linked: { id: string; date: Date; instrument: string; setupType: string | null } | null;
}) {
  const [pending, startTransition] = useTransition();
  const [candidates, setCandidates] = useState<ScoredCandidate[] | null>(null);
  const [error, setError] = useState("");

  function loadCandidates() {
    setError("");
    startTransition(async () => {
      try {
        setCandidates(await getMatchCandidates(brokerTradeId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Adaylar yüklenemedi.");
      }
    });
  }

  function link(tradeId: string | null) {
    setError("");
    startTransition(async () => {
      try {
        await linkBrokerTradeToJournal(brokerTradeId, tradeId);
        setCandidates(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Bağlanamadı.");
      }
    });
  }

  return (
    <div
      className="rounded-xl border p-5 space-y-3"
      style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--color-text-muted)" }}
        >
          Journal bağlantısı
        </h3>
        {pending && <Loader2 size={14} className="animate-spin" style={{ color: "var(--color-text-muted)" }} />}
      </div>

      {linked ? (
        <div className="flex items-center gap-3 flex-wrap">
          <Link2 size={16} style={{ color: "var(--color-success)" }} aria-hidden="true" />
          <Link
            href={`/journal/${linked.id}`}
            className="text-sm underline"
            style={{ color: "var(--color-text-primary)" }}
          >
            {linked.instrument} · {linked.setupType ?? "setup yok"} ·{" "}
            {new Date(linked.date).toLocaleDateString("tr-TR")}
          </Link>
          <button
            type="button"
            onClick={() => link(null)}
            disabled={pending}
            className="ml-auto flex items-center gap-1.5 text-xs disabled:opacity-40"
            style={{ color: "var(--color-text-muted)" }}
          >
            <Link2Off size={13} aria-hidden="true" />
            Bağlantıyı kaldır
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Bu pozisyon henüz bir plana bağlı değil. Bağlanınca &ldquo;kurala uygun
            girdiklerim gerçekte ne getirdi&rdquo; sorusu cevaplanabilir hale gelir.
          </p>
          {candidates === null ? (
            <button
              type="button"
              onClick={loadCandidates}
              disabled={pending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              <Search size={13} aria-hidden="true" />
              Journal kaydı ara
            </button>
          ) : candidates.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Bu tarih aralığında journal kaydı yok.{" "}
              <Link href="/journal/new" className="underline" style={{ color: "var(--color-accent)" }}>
                Yeni kayıt oluştur
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-1.5">
              {candidates.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => link(c.id)}
                    disabled={pending}
                    className="w-full flex items-center gap-3 text-left rounded-lg border px-3 py-2 disabled:opacity-40 hover-surface"
                    style={{ borderColor: "var(--color-bg-border)", background: "var(--color-bg-surface)" }}
                  >
                    <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {c.instrument} · {c.direction}
                    </span>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {new Date(c.date).toLocaleDateString("tr-TR")} · {c.setupType ?? "setup yok"}
                    </span>
                    {/* Neden onerildigi acikca yaziyor: kullanici korlemesine
                        bir siralamaya guvenmek zorunda kalmasin. */}
                    <span
                      className="ml-auto text-[11px]"
                      style={{ color: c.score === 3 ? "var(--color-success)" : "var(--color-text-muted)" }}
                    >
                      {c.reasons.length > 0 ? c.reasons.join(" · ") : "zayıf eşleşme"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {error && (
        <p className="text-xs" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
