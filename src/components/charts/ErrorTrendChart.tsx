"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatTimeLabel(time: string): string {
  const date = new Date(time);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return time.length > 16 ? time.slice(11, 16) : time;
}

export function ErrorTrendChart({
  data,
}: {
  data: { time: string; errors: number; errorRatePct: number }[];
}) {
  if (!data.length) {
    return <p className="py-8 text-center text-sm text-slate-500">No timeline data available</p>;
  }

  const chartData = data.map((point, index) => ({
    label: formatTimeLabel(point.time) || `T${index + 1}`,
    errors: point.errors,
    errorRatePct: Number(point.errorRatePct.toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="errors" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis
          yAxisId="rate"
          orientation="right"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          formatter={(value: number, name: string) =>
            name === "errorRatePct" ? [`${value}%`, "Error rate"] : [value, "Errors"]
          }
        />
        <Area
          yAxisId="errors"
          type="monotone"
          dataKey="errors"
          stroke="#dc2626"
          fill="url(#errorGradient)"
          strokeWidth={2}
        />
        <Area
          yAxisId="rate"
          type="monotone"
          dataKey="errorRatePct"
          stroke="#f59e0b"
          fill="none"
          strokeWidth={2}
          strokeDasharray="4 4"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
