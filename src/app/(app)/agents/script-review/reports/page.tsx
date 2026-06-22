import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { createClient } from "@/lib/supabase/server";
import { formatDate, readinessLabel, severityColor, pillBadge } from "@/lib/utils";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("script_reviews")
    .select("id, script_name, score, readiness, created_at, external_review_id")
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          { label: "Script Review Agent", href: "/agents/script-review" },
          { label: "Reports" },
        ]}
      />
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="mt-2 text-slate-500">Script review reports generated from your workspace.</p>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-3 sm:px-4">Script</th>
              <th className="hidden px-3 py-3 md:table-cell sm:px-4">Review ID</th>
              <th className="hidden px-3 py-3 lg:table-cell sm:px-4">Date</th>
              <th className="whitespace-nowrap px-3 py-3 sm:px-4">Score</th>
              <th className="whitespace-nowrap px-3 py-3 sm:px-4">Readiness</th>
              <th className="px-3 py-3 sm:px-4"></th>
            </tr>
          </thead>
          <tbody>
            {(reviews ?? []).map((r) => (
              <tr key={r.id} className="border-t border-slate-50">
                <td className="max-w-[8rem] truncate px-3 py-3 font-medium sm:max-w-none sm:px-4">
                  {r.script_name}
                </td>
                <td className="hidden px-3 py-3 font-mono text-xs md:table-cell sm:px-4">
                  {r.external_review_id ?? "-"}
                </td>
                <td className="hidden px-3 py-3 text-slate-500 lg:table-cell sm:px-4">
                  {formatDate(r.created_at)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 font-bold sm:px-4">{r.score ?? "-"}/100</td>
                <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                  {r.readiness ? (
                    <span
                      className={pillBadge(
                        severityColor(
                          r.readiness === "ready" || r.readiness === "ready_minor" ? "low" : "critical"
                        )
                      )}
                    >
                      {readinessLabel(r.readiness)}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                  <Link
                    href={`/agents/script-review/${r.id}/report`}
                    className="text-brand-600 hover:underline"
                  >
                    Open report
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!reviews?.length && (
          <p className="p-8 text-center text-slate-500">
            No reports yet. Complete a script review to generate one.
          </p>
        )}
      </div>
    </div>
  );
}
