import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { BlazeMeterIcon } from "@/components/integrations/BlazeMeterIcon";
import {
  ResultsAnalysisOverviewActions,
  ResultsAnalysisNewLink,
} from "@/components/results-analysis/ResultsAnalysisOverviewActions";
import {
  isBlazeMeterConfigured,
  listResultsAnalyses,
} from "@/lib/results-analysis-service-server";
import { formatDate, pillBadge, scoreColor } from "@/lib/utils";

export default async function ResultsAnalysisOverviewPage() {
  const [analyses, blazemeterConfigured] = await Promise.all([
    listResultsAnalyses(8),
    isBlazeMeterConfigured(),
  ]);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          { label: "BlazeMeter Results Analysis Agent" },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50">
            <BlazeMeterIcon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">BlazeMeter Results Analysis Agent</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Intelligently analyze BlazeMeter results to identify performance issues, risks, and
              optimization opportunities.
            </p>
          </div>
        </div>
      </div>

      <ResultsAnalysisOverviewActions blazemeterConfigured={blazemeterConfigured} />

      {!blazemeterConfigured && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          BlazeMeter API is not configured. CSV upload works without API.{" "}
          <Link href="/integrations" className="font-medium underline">
            Set up BlazeMeter connection
          </Link>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Recent Analyses</h2>
          <Link href="/agents/results-analysis/history" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {analyses.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No analyses yet.{" "}
            <ResultsAnalysisNewLink className="text-brand-600 underline">
              Start your first analysis
            </ResultsAnalysisNewLink>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Run Name</th>
                  <th className="px-4 py-3">Environment</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Users</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{a.runName}</td>
                    <td className="px-4 py-3">{a.testContext.environment}</td>
                    <td className="px-4 py-3">{formatDate(a.createdAt)}</td>
                    <td className="px-4 py-3">{a.testContext.targetUsers}</td>
                    <td className="px-4 py-3">
                      <span
                        className={pillBadge(
                          a.status === "completed"
                            ? a.overallStatus === "fail"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : a.overallStatus === "warning"
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-green-100 text-green-800 border-green-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {a.status === "completed" ? "Completed" : a.status}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-semibold ${scoreColor(a.performanceScore ?? 0)}`}>
                      {a.performanceScore ?? "-"}/100
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={
                          a.status === "completed"
                            ? `/agents/results-analysis/${a.id}`
                            : `/agents/results-analysis/${a.id}/analyzing`
                        }
                        className="text-brand-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
