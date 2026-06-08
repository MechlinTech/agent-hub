import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { createClient } from "@/lib/supabase/server";
import { formatDate, readinessLabel } from "@/lib/utils";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("script_reviews")
    .select("id, script_name, score, readiness, created_at, external_review_id")
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  return (
    <div>
      <Breadcrumbs items={[{ label: "Home", href: "/dashboard" }, { label: "Reports" }]} />
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="mt-2 text-slate-500">Script review reports generated from your workspace.</p>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Script</th>
              <th className="px-4 py-3">Review ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Readiness</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(reviews ?? []).map((r) => (
              <tr key={r.id} className="border-t border-slate-50">
                <td className="px-4 py-3 font-medium">{r.script_name}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.external_review_id ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(r.created_at)}</td>
                <td className="px-4 py-3 font-bold">{r.score ?? "—"}/100</td>
                <td className="px-4 py-3">
                  {r.readiness ? readinessLabel(r.readiness) : "—"}
                </td>
                <td className="px-4 py-3">
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
