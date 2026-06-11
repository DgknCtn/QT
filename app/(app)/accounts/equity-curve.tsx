"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

interface Props {
  logs: { date: string; equity: number }[];
  startingBalance: number;
}

export function EquityCurve({ logs, startingBalance }: Props) {
  const data = logs.map((l) => ({
    date:   l.date,
    equity: l.equity,
    pnl:    parseFloat((l.equity - startingBalance).toFixed(2)),
  }));

  const min = Math.min(...data.map((d) => d.equity));
  const max = Math.max(...data.map((d) => d.equity));
  const padding = (max - min) * 0.15 || 100;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v.slice(5)}
        />
        <YAxis
          domain={[min - padding, max + padding]}
          tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v.toLocaleString()}`}
          width={72}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-bg-border)",
            borderRadius: 8,
            color: "var(--color-text-primary)",
            fontSize: 12,
          }}
          formatter={(value, name) => {
            const n = Number(value);
            return [
              name === "equity" ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : `${n >= 0 ? "+" : ""}$${n.toFixed(2)}`,
              name === "equity" ? "Equity" : "P&L",
            ] as [string, string];
          }}
        />
        <ReferenceLine y={startingBalance} stroke="var(--color-bg-border)" strokeDasharray="4 2" />
        <Line
          type="monotone"
          dataKey="equity"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#6366f1" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
