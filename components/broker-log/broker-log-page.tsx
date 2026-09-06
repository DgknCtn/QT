import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/ui-kit/stat-card";
import { ImportUploader } from "@/app/(app)/trade-log/import-uploader";
import { TradeRow } from "@/app/(app)/trade-log/trade-row";
import { QuarterMatrix } from "./quarter-matrix";
import { SymbolTable } from "./symbol-table";
import { BROKER_SOURCES, type BrokerSource } from "@/lib/broker/sources";
import { buildQuarterCells, buildSymbolStats, buildFeeSummary } from "@/lib/broker/stats";
import { formatUsd } from "@/lib/money";

const PAGE_SIZE = 100;

/**
 * Tek bir brokerın pozisyon defteri.
 *
 * Her borsa kendi sayfasında durur (istatistikleri karıştırmamak için) ama
 * sayfanın gövdesi tek: KPI şeridi, QT seans×çeyrek matrisi, sembol tablosu,
 * maliyet dökümü ve güne göre gruplanmış pozisyon listesi. Borsaya özel
 * farklar `lib/broker/sources.ts` kaydından okunur.
 */
export async function BrokerLogPage({
  source,
  icon: Icon,
  subtitle,
  searchParams,
}: {
  source: BrokerSource;
  icon: LucideIcon;
  subtitle: string;
  searchParams: Promise<{ page?: string }>;
}) {
  const info = BROKER_SOURCES[source];
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const where = { userId: user.id, source };

  // Analiz blokları tüm pozisyonlara bakar, liste sayfalanır. İki ayrı sorgu:
  // analiz için yalnızca gereken alanlar çekiliyor, satır listesi tam kayıt.
  const [totalCount, allTrades, trades] = await Promise.all([
    prisma.brokerTrade.count({ where }),
    prisma.brokerTrade.findMany({
      where,
      select: {
        netPnl: true, grossPnl: true, fees: true, fundingFee: true,
        instrument: true, session: true, quarter90: true,
      },
    }),
    prisma.brokerTrade.findMany({
      where,
      orderBy: { entryTime: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const { cells, maxAbs } = buildQuarterCells(allTrades);
  const symbolStats = buildSymbolStats(allTrades);
  const fee = buildFeeSummary(allTrades);

  const decided = allTrades.filter((t) => t.netPnl != null);
  const wins = decided.filter((t) => (t.netPnl ?? 0) > 0).length;
  const winRate = decided.length > 0 ? Math.round((wins / decided.length) * 100) : null;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const groups = new Map<string, typeof trades>();
  for (const t of trades) {
    const key = format(new Date(t.entryTime), "yyyy-MM-dd");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{info.label}</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{subtitle}</p>
        </div>
        <ImportUploader source={source} />
      </div>

      {totalCount === 0 ? (
        <div
          className="rounded-xl border flex flex-col items-center justify-center py-20 gap-3"
          style={{ background: "var(--color-bg-elevated)", borderColor: "var(--color-bg-border)" }}
        >
          <Icon size={32} style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Henüz {info.label} pozisyonu içe aktarılmadı
          </p>
          <p className="text-xs max-w-sm text-center" style={{ color: "var(--color-text-muted)" }}>
            {info.exportHint} ile indirdiğiniz CSV&apos;yi yükleyin.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Net P&L"
              value={`${fee.net >= 0 ? "+" : ""}$${fee.net.toFixed(2)}`}
              valueColor={fee.net >= 0 ? "var(--color-success)" : "var(--color-danger)"}
              sub={`${totalCount} pozisyon`}
            />
            <StatCard
              label="Kazanma oranı"
              value={winRate != null ? `%${winRate}` : null}
              sub={`${wins}/${decided.length} kazanan`}
            />
            <StatCard
              label="Brüt P&L"
              value={formatUsd(fee.gross, { signed: true })}
              valueColor={fee.gross >= 0 ? "var(--color-success)" : "var(--color-danger)"}
              sub="maliyet öncesi"
            />
            {info.hasFunding ? (
              <StatCard
                label="Funding"
                value={formatUsd(-fee.funding, { signed: true })}
                valueColor={fee.funding > 0 ? "var(--color-warning)" : "var(--color-success)"}
                sub={fee.funding > 0 ? "ödedin" : "sana ödendi"}
              />
            ) : (
              <StatCard
                label="Ödenen fee"
                value={`$${fee.fees.toFixed(2)}`}
                valueColor="var(--color-warning)"
                sub={
                  fee.feeRatio != null
                    ? `brüt kârın %${Math.round(fee.feeRatio * 100)}'i`
                    : "brüt zararda — oran yok"
                }
              />
            )}
          </div>

          <Section
            title="Seans × Çeyrek"
            hint="Pozisyonun açıldığı ana göre, ET. Renk yoğunluğu net P&L'i gösterir."
          >
            <QuarterMatrix cells={cells} maxAbs={maxAbs} />
          </Section>

          <Section title="Sembol performansı" hint={`${symbolStats.length} enstrüman`}>
            <SymbolTable stats={symbolStats} />
          </Section>

          <Section
            title="Maliyet etkisi"
            hint={info.hasFunding ? "işlem komisyonu + perp funding" : undefined}
          >
            <CostBreakdown
              gross={fee.gross}
              fees={fee.fees}
              funding={info.hasFunding ? fee.funding : null}
              net={fee.net}
            />
          </Section>

          <div className="space-y-4">
            {[...groups.entries()].map(([day, dayTrades]) => {
              const dayNet = dayTrades.reduce((s, t) => s + (t.netPnl ?? 0), 0);
              return (
                <div key={day} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-bg-border)" }}>
                  <div className="flex items-center justify-between px-4 py-2" style={{ background: "var(--color-bg-surface)" }}>
                    <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                      {format(new Date(day), "EEEE, d MMMM yyyy")} · {dayTrades.length} pozisyon
                    </span>
                    <span className="text-xs font-mono font-semibold" style={{ color: dayNet >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                      {dayNet >= 0 ? "+" : ""}${dayNet.toFixed(2)}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ color: "var(--color-text-muted)" }}>
                          <th className="text-left px-4 py-2">Saat</th>
                          <th className="text-left px-3 py-2">Sembol</th>
                          <th className="text-left px-3 py-2">Yön</th>
                          <th className="text-left px-3 py-2">Çeyrek</th>
                          <th className="text-right px-3 py-2">{info.quantityLabel}</th>
                          <th className="text-right px-3 py-2">Giriş</th>
                          <th className="text-right px-3 py-2">Çıkış</th>
                          <th className="text-right px-3 py-2">Net P&L</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {dayTrades.map((t) => (
                          <TradeRow key={t.id} trade={t} showQuarter />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              {page > 1 ? (
                <Link href={`${info.href}?page=${page - 1}`} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "var(--color-bg-border)", color: "var(--color-text-secondary)" }}>
                  <ArrowLeft size={12} /> Önceki
                </Link>
              ) : <span />}
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{page} / {totalPages}</span>
              {page < totalPages ? (
                <Link href={`${info.href}?page=${page + 1}`} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "var(--color-bg-border)", color: "var(--color-text-secondary)" }}>
                  Sonraki <ArrowRight size={12} />
                </Link>
              ) : <span />}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-bg-border)" }}>
      <div className="px-4 py-2 flex items-baseline justify-between gap-3" style={{ background: "var(--color-bg-surface)" }}>
        <span className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>{title}</span>
        {hint && <span className="text-xs text-right" style={{ color: "var(--color-text-muted)" }}>{hint}</span>}
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

/** Brüt kârdan maliyetlerin ne kadarını götürdüğünü tek bakışta gösteren şerit. */
function CostBreakdown({
  gross,
  fees,
  funding,
  net,
}: {
  gross: number;
  fees: number;
  funding: number | null;
  net: number;
}) {
  const rows: { label: string; value: number; color: string }[] = [
    { label: "Brüt P&L", value: gross, color: gross >= 0 ? "var(--color-success)" : "var(--color-danger)" },
    { label: "İşlem fee", value: -fees, color: "var(--color-warning)" },
  ];
  if (funding !== null) {
    rows.push({
      label: "Funding",
      value: -funding,
      color: funding > 0 ? "var(--color-warning)" : "var(--color-success)",
    });
  }
  rows.push({ label: "Net P&L", value: net, color: net >= 0 ? "var(--color-success)" : "var(--color-danger)" });

  const span = Math.max(...rows.map((r) => Math.abs(r.value)), 1);

  return (
    <div className="px-2 py-1 space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="text-xs w-20 flex-shrink-0" style={{ color: "var(--color-text-muted)" }}>{r.label}</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--color-bg-surface)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min((Math.abs(r.value) / span) * 100, 100)}%`, background: r.color }}
            />
          </div>
          <span className="text-xs font-mono font-semibold w-24 text-right" style={{ color: r.color }}>
            {r.value >= 0 ? "+" : ""}${r.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}
