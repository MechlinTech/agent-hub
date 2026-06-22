import type { BlazeMeterMasterListItem } from "@/lib/blazemeter/client";
import {
  parseErrorStatsCsv,
  parseRequestStatsBundle,
  parseTimelineCsv,
} from "@/lib/results-analysis/csv-parser";
import { aggregateSummaryMetrics } from "@/lib/results-analysis/score-engine";
import type {
  BlazeMeterApiSummary,
  BlazeMeterKpiTimeline,
  BlazeMeterSnapshot,
  ParsedErrorRow,
  ParsedTransaction,
  ScriptSummaryRow,
} from "@/lib/results-analysis/types";
import type { AnalysisFileBundle } from "@/lib/results-analysis/analysis-runner";

export function buildBlazeMeterSnapshot(input: {
  master: BlazeMeterMasterListItem;
  files: AnalysisFileBundle;
  kpiTimeline?: BlazeMeterKpiTimeline;
  apiSummary?: BlazeMeterApiSummary | null;
  scenarioScriptSummaries?: ScriptSummaryRow[];
}): BlazeMeterSnapshot {
  const requestBundle = input.files.requestStats
    ? parseRequestStatsBundle(input.files.requestStats)
    : { transactions: [] as ParsedTransaction[], totalRow: null };
  const errorRows: ParsedErrorRow[] = input.files.errorStats
    ? parseErrorStatsCsv(input.files.errorStats)
    : [];
  const timeline = input.files.timeline ? parseTimelineCsv(input.files.timeline) : null;
  const summaryMetrics = aggregateSummaryMetrics(requestBundle.transactions, requestBundle.totalRow);

  const created = input.master.created ? input.master.created * 1000 : Date.now();
  const ended = input.master.ended ? input.master.ended * 1000 : Date.now();
  const durationMinutes = Math.max(1, Math.round((ended - created) / 60000));
  const activeDurationMinutes = summaryMetrics.activeDurationMinutes ?? null;

  return {
    masterId: String(input.master.id),
    fetchedAt: new Date().toISOString(),
    master: {
      id: input.master.id,
      name: input.master.name?.trim() || `Run ${input.master.id}`,
      testId: input.master.testId ?? null,
      created: input.master.created ?? null,
      ended: input.master.ended ?? null,
      maxUsers: input.master.maxUsers ?? null,
      passed: input.master.passed ?? null,
      note: input.master.note ?? null,
      durationMinutes,
      activeDurationMinutes,
      createdAtIso: new Date(created).toISOString(),
      endedAtIso: input.master.ended ? new Date(ended).toISOString() : null,
    },
    summary: {
      ...summaryMetrics,
      source: requestBundle.totalRow ? "total_row" : "aggregated",
    },
    transactions: requestBundle.transactions,
    totalRow: requestBundle.totalRow,
    errorRows,
    timelinePoints: timeline?.errorTrend ?? [],
    kpiTimeline: input.kpiTimeline,
    apiSummary: input.apiSummary ?? null,
    scenarioScriptSummaries:
      input.scenarioScriptSummaries && input.scenarioScriptSummaries.length > 0
        ? input.scenarioScriptSummaries
        : undefined,
    scenariosMapping:
      input.master.scenariosMapping && input.master.scenariosMapping.length > 0
        ? input.master.scenariosMapping
        : undefined,
    filesImported: {
      requestStats: Boolean(input.files.requestStats),
      errorStats: Boolean(input.files.errorStats?.trim()),
      timeline: Boolean(input.files.timeline?.trim()),
    },
    reportStats: {
      requestStatsLines: input.files.requestStats?.split(/\r?\n/).filter(Boolean).length ?? 0,
      errorStatsLines: input.files.errorStats?.split(/\r?\n/).filter(Boolean).length ?? 0,
      timelineLines: input.files.timeline?.split(/\r?\n/).filter(Boolean).length ?? 0,
    },
  };
}
