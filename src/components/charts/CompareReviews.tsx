"use client";

import { useState } from "react";
import { scoreColor, readinessLabel, severityColor, pillBadge } from "@/lib/utils";
import { StyledSelect } from "@/components/ui/StyledSelect";

interface ReviewOption {
  id: string;
  script_name: string;
  score: number | null;
  readiness: string | null;
}

function readinessSeverity(readiness: string | null): string {
  if (readiness === "ready" || readiness === "ready_minor") return "low";
  if (readiness === "not_ready" || readiness === "high_risk") return "critical";
  return "medium";
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
        <StyledSelect
          value={a}
          onChange={setA}
          options={[
            { value: "", label: "Review A" },
            ...reviews.map((r) => ({ value: r.id, label: r.script_name })),
          ]}
        />
        <StyledSelect
          value={b}
          onChange={setB}
          options={[
            { value: "", label: "Review B" },
            ...reviews.map((r) => ({ value: r.id, label: r.script_name })),
          ]}
        />
      </div>
      {reviewA && reviewB && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[20rem] text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-2 pr-4">Metric</th>
                <th className="pb-2 pr-4 whitespace-nowrap">A</th>
                <th className="pb-2 whitespace-nowrap">B</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 pr-4">Score</td>
                <td className={`py-2 pr-4 font-bold whitespace-nowrap ${scoreColor(reviewA.score ?? 0)}`}>
                  {reviewA.score ?? "-"}
                </td>
                <td className={`py-2 font-bold whitespace-nowrap ${scoreColor(reviewB.score ?? 0)}`}>
                  {reviewB.score ?? "-"}
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 align-top">Readiness</td>
                <td className="whitespace-nowrap py-2 pr-4">
                  {reviewA.readiness ? (
                    <span className={pillBadge(severityColor(readinessSeverity(reviewA.readiness)))}>
                      {readinessLabel(reviewA.readiness)}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="whitespace-nowrap py-2">
                  {reviewB.readiness ? (
                    <span className={pillBadge(severityColor(readinessSeverity(reviewB.readiness)))}>
                      {readinessLabel(reviewB.readiness)}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
