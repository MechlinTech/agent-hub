"use client";

import { useState } from "react";
import Link from "next/link";
import { FileDown } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ScriptLevelExecutiveSummary } from "@/components/results-analysis/ScriptLevelExecutiveSummary";
import {
  buildLibraryExportContext,
  exportScriptExecutiveSummaryPdf,
} from "@/lib/results-analysis/script-executive-summary-pdf";
import type { ExecutiveSummaryLibraryRecord, ScriptSummaryRow } from "@/lib/results-analysis/types";
import { formatDate } from "@/lib/utils";

export function ExecutiveSummaryLibraryDetail({
  initialEntry,
}: {
  initialEntry: ExecutiveSummaryLibraryRecord;
}) {
  const [entry] = useState(initialEntry);
  const [scriptRows, setScriptRows] = useState<ScriptSummaryRow[]>(initialEntry.scriptSummaries);
  const [exportingPdf, setExportingPdf] = useState(false);

  const exportContext = buildLibraryExportContext(entry);

  function handleExportPdf() {
    setExportingPdf(true);
    try {
      exportScriptExecutiveSummaryPdf(scriptRows, exportContext);
    } finally {
      setTimeout(() => setExportingPdf(false), 800);
    }
  }

  const analysisContext = {
    runName: entry.runName,
    externalId: entry.externalAnalysisId ?? undefined,
    masterId: entry.masterId,
    testContext: {
      projectName: entry.projectName ?? "",
      environment: entry.environment ?? "",
      buildVersion: entry.buildVersion ?? "",
      testType: "",
      targetUsers: 0,
      durationMinutes: 0,
    },
  };

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          { label: "BlazeMeter Results Analysis", href: "/agents/results-analysis" },
          { label: "Library", href: "/agents/results-analysis/library" },
          { label: entry.runName },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{entry.runName}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Exported {formatDate(entry.exportedAt)}
            {entry.analysisId && (
              <>
                {" · "}
                <Link
                  href={`/agents/results-analysis/${entry.analysisId}`}
                  className="text-brand-600 hover:underline"
                >
                  View source analysis
                </Link>
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Add Bug ID and Comments per script in the table below. Changes save automatically.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <FileDown className="h-4 w-4" />
            {exportingPdf ? "Exporting…" : "Export PDF"}
          </button>
        </div>
      </div>

      <ScriptLevelExecutiveSummary
        rows={entry.scriptSummaries}
        analysis={analysisContext}
        showHeaderActions={false}
        editableFields
        libraryEntryId={entry.id}
        onRowsChange={setScriptRows}
      />
    </div>
  );
}
