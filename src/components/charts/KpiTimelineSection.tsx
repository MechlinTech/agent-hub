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
import type { BlazeMeterKpiTimeline, KpiTimelinePoint } from "@/lib/results-analysis/types";

function formatTimeLabel(time: string): string {
  const date = new Date(time);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return time.length > 16 ? time.slice(11, 16) : time;
}

export function SimpleTrendChart({
  data,
  valueLabel,
  color,
  valueFormatter,
}: {
  data: KpiTimelinePoint[];
  valueLabel: string;
  color: string;
  valueFormatter?: (v: number) => string;
}) {
  if (!data.length) {
    return <p className="py-6 text-center text-sm text-slate-500">No data available</p>;
  }

  const chartData = data.map((point, index) => ({
    label: formatTimeLabel(point.time) || `T${index + 1}`,
    value: Number(point.value.toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value: number) => [
            valueFormatter ? valueFormatter(value) : value,
            valueLabel,
          ]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          fill={`url(#grad-${color.replace("#", "")})`}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function KpiTimelineSection({ kpiTimeline }: { kpiTimeline: BlazeMeterKpiTimeline }) {
  const sections = [
    {
      title: "Hits per second",
      data: kpiTimeline.hitsPerSec,
      color: "#2563eb",
      formatter: (v: number) => `${v.toFixed(2)} / sec`,
    },
    {
      title: "Response time",
      data: kpiTimeline.responseTimeMs,
      color: "#7c3aed",
      formatter: (v: number) => `${v.toFixed(0)} ms`,
    },
    {
      title: "Errors",
      data: kpiTimeline.errors,
      color: "#dc2626",
      formatter: (v: number) => v.toLocaleString(),
    },
    {
      title: "Bandwidth",
      data: kpiTimeline.bandwidthKiBps,
      color: "#059669",
      formatter: (v: number) => `${v.toFixed(2)} KiB/s`,
    },
    {
      title: "Active threads (VU)",
      data: kpiTimeline.activeThreads,
      color: "#d97706",
      formatter: (v: number) => String(Math.round(v)),
    },
  ].filter((s) => s.data.length > 0);

  if (sections.length === 0) return null;

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.title} className="card p-5">
          <h3 className="mb-3 font-semibold text-slate-900">{section.title}</h3>
          <SimpleTrendChart
            data={section.data}
            valueLabel={section.title}
            color={section.color}
            valueFormatter={section.formatter}
          />
        </div>
      ))}
    </div>
  );
}
