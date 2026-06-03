"use client";

import { useState } from "react";
import { scoreColor, readinessLabel } from "@/lib/utils";

interface ReviewOption {
  id: string;
  script_name: string;
  score: number | null;
  readiness: string | null;
}

export function CompareReviews({ reviews }: { reviews: ReviewOption[] }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const reviewA = reviews.find((r) => r.id === a);
  const reviewB = reviews.find((r) => r.id === b);

  if (reviews.length < 2) return null;

  return (
    <div className="card p-4">
      <h3 className="font-semibold">Compare Reviews</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <select value={a} onChange={(e) => setA(e.target.value)} className="rounded-lg border px-2 py-1.5 text-sm">
          <option value="">Review A</option>
          {reviews.map((r) => (
            <option key={r.id} value={r.id}>
              {r.script_name}
            </option>
          ))}
        </select>
        <select value={b} onChange={(e) => setB(e.target.value)} className="rounded-lg border px-2 py-1.5 text-sm">
          <option value="">Review B</option>
          {reviews.map((r) => (
            <option key={r.id} value={r.id}>
              {r.script_name}
            </option>
          ))}
        </select>
      </div>
      {reviewA && reviewB && (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="pb-2">Metric</th>
              <th>A</th>
              <th>B</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1">Score</td>
              <td className={scoreColor(reviewA.score ?? 0)}>{reviewA.score ?? "—"}</td>
              <td className={scoreColor(reviewB.score ?? 0)}>{reviewB.score ?? "—"}</td>
            </tr>
            <tr>
              <td className="py-1">Readiness</td>
              <td>{reviewA.readiness ? readinessLabel(reviewA.readiness) : "—"}</td>
              <td>{reviewB.readiness ? readinessLabel(reviewB.readiness) : "—"}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
