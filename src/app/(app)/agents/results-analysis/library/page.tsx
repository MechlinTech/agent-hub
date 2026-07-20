import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { listExecutiveSummaryLibrary } from "@/lib/executive-summary-library-service-server";
import { formatDate, pillBadge } from "@/lib/utils";

export default async function ExecutiveSummaryLibraryPage() {
  const entries = await listExecutiveSummaryLibrary(100);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          {
            label: "BlazeMeter Results Analysis",
            href: "/agents/results-analysis",
          },
          { label: "Library" },
        ]}
      />
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Executive Summary Library
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Script-level executive summaries exported from analysis results.
            Track Bug ID and comments per script, then export PDF.
          </p>
        </div>
        <Link href="/agents/results-analysis/history" className="btn-secondary">
          View Analyses
        </Link>
      </div>

      <div className="card overflow-hidden">
        {entries.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            <p>No summaries in the library yet.</p>
            <p className="mt-2">
              Open a completed analysis and use{" "}
              <span className="font-medium text-slate-700">
                Export to Library
              </span>{" "}
              on the Script-Level Executive Summary.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Run Name</th>
                  <th className="px-4 py-3">Environment</th>
                  <th className="px-4 py-3">Scripts</th>
                  <th className="px-4 py-3">Pass / Fail</th>
                  <th className="px-4 py-3">Bugs Tracked</th>
                  <th className="px-4 py-3">Exported</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{entry.runName}</td>
                    <td className="px-4 py-3">{entry.environment ?? "-"}</td>
                    <td className="px-4 py-3">{entry.scriptCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={pillBadge(
                          "bg-emerald-50 text-emerald-700 border-emerald-200",
                        )}
                      >
                        {entry.passCount} pass
                      </span>
                      <span className="ml-2">
                        <span
                          className={pillBadge(
                            "bg-rose-50 text-rose-700 border-rose-200",
                          )}
                        >
                          {entry.failCount} fail
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {entry.scriptSummaries.filter((s) => s.bugId?.trim())
                        .length || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(entry.exportedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/agents/results-analysis/library/${entry.id}`}
                        className="text-brand-600 hover:underline"
                      >
                        Open
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
