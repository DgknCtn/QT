"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

interface Props {
  points: { label: string; r: number; cumR: number }[];
}

export function CumulativeRChart({ points }: Props) {
  const min = Math.min(...points.map((p) => p.cumR), 0);
  const max = Math.max(...points.map((p) => p.cumR), 0);
  const padding = Math.max((max - min) * 0.2, 0.5);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={points} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--color-text-muted)", fontSize: 9 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[min - padding, max + padding]}
          tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}R`}
          width={52}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-bg-border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--color-text-primary)",
          }}
          formatter={(value, name) => {
            const n = Number(value);
            return [`${n >= 0 ? "+" : ""}${n.toFixed(2)}R`, name === "cumR" ? "Kümülatif R" : "Trade R"] as [string, string];
          }}
          labelStyle={{ color: "var(--color-text-muted)", marginBottom: 4 }}
        />
        <ReferenceLine y={0} stroke="var(--color-bg-border)" strokeDasharray="4 2" />
        <Line
          type="monotone"
          dataKey="cumR"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#6366f1" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
