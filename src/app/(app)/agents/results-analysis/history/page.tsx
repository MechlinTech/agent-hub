import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ResultsAnalysisNewLink } from "@/components/results-analysis/ResultsAnalysisOverviewActions";
import { listResultsAnalyses } from "@/lib/results-analysis-service-server";
import { formatDate, pillBadge, scoreColor } from "@/lib/utils";

export default async function ResultsAnalysisHistoryPage() {
  const analyses = await listResultsAnalyses(50);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          { label: "BlazeMeter Results Analysis", href: "/agents/results-analysis" },
          { label: "History" },
        ]}
      />
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analysis History</h1>
          <p className="mt-1 text-sm text-slate-500">Previously generated BlazeMeter result analyses.</p>
        </div>
        <ResultsAnalysisNewLink className="btn-primary">New Analysis</ResultsAnalysisNewLink>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Run Name</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Environment</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {analyses.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{a.runName}</td>
                  <td className="px-4 py-3 text-slate-500">{a.externalId}</td>
                  <td className="px-4 py-3">{a.testContext.environment}</td>
                  <td className="px-4 py-3">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={pillBadge("bg-slate-100 text-slate-700 border-slate-200")}>{a.status}</span>
                  </td>
                  <td className={`px-4 py-3 font-semibold ${scoreColor(a.performanceScore ?? 0)}`}>
                    {a.performanceScore ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/agents/results-analysis/${a.id}`} className="text-brand-600 hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
