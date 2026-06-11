import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const trades = await prisma.trade.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    include: { tags: { include: { tag: true } } },
  });

  const headers = [
    "Date", "Instrument", "Direction", "Session", "Setup Type",
    "Result", "R Result", "Risk %", "P&L ($)", "P&L (pts)",
    "Entry", "Stop", "TP1", "TP2", "TP3",
    "Process Grade", "Process Score",
    "Triad", "Market Group", "Entry Model",
    "Near News", "Plan Followed", "Mistakes", "Positives", "Notes",
  ];

  const rows = trades.map((t) => {
    const mistakes  = t.tags.filter((tt) => tt.tag.category === "MISTAKE").map((tt) => tt.tag.name).join("; ");
    const positives = t.tags.filter((tt) => tt.tag.category === "POSITIVE").map((tt) => tt.tag.name).join("; ");

    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    return [
      format(new Date(t.date), "yyyy-MM-dd"),
      t.instrument,
      t.direction,
      t.session ?? "",
      t.setupType ?? "",
      t.result,
      t.rResult ?? "",
      t.riskPercent ?? "",
      t.pnlCurrency ?? "",
      t.pnlPoints ?? "",
      t.entryPrice ?? "",
      t.stopPrice ?? "",
      t.tp1 ?? "",
      t.tp2 ?? "",
      t.tp3 ?? "",
      t.processGrade ?? "",
      t.processScore ?? "",
      t.triad ?? "",
      t.marketGroup ?? "",
      t.entryModel ?? "",
      t.nearNews ?? "",
      t.planFollowed ?? "",
      mistakes,
      positives,
      t.notes ?? "",
    ].map(esc).join(",");
  });

  const csv = [headers.join(","), ...rows].join("\r\n");
  const filename = `trades_${format(new Date(), "yyyy-MM-dd")}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
