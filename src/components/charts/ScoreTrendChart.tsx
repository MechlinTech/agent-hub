"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatDate } from "@/lib/utils";

export function ScoreTrendChart({
  data,
}: {
  data: { date: string; score: number; script_name: string }[];
}) {
  if (!data.length) {
    return <p className="py-8 text-center text-sm text-slate-500">No score history yet</p>;
  }

  const chartData = [...data].reverse().map((d) => ({
    label: formatDate(d.date).split(",")[0],
    score: d.score,
    script: d.script_name,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
