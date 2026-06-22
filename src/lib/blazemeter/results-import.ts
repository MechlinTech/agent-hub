import {
  downloadMasterReportText,
  fetchMasterApiSummary,
  fetchMasterKpiTimeline,
  fetchMasterKpiTimelineBundle,
  fetchScenarioScriptSummaries,
  getMaster,
  type BlazeMeterApiError,
} from "@/lib/blazemeter/client";
import type { AnalysisFileBundle } from "@/lib/results-analysis/analysis-runner";
import { buildBlazeMeterSnapshot } from "@/lib/blazemeter/snapshot";
import type { BlazeMeterSnapshot } from "@/lib/results-analysis/types";

export interface ImportedMasterReports {
  masterId: string;
  runName: string;
  files: AnalysisFileBundle;
  maxUsers: number;
  durationMinutes: number;
  snapshot: BlazeMeterSnapshot;
}

export async function fetchReportsForMaster(masterId: string): Promise<ImportedMasterReports> {
  const master = await getMaster(masterId);
  const requestStats = await downloadMasterReportText(masterId, "aggregatereport");
  let errorStats = "";
  try {
    errorStats = await downloadMasterReportText(masterId, "errorsreport");
  } catch {
    errorStats = "Label,Response Code,Response Message,# Samples\n";
  }

  const timeline = await fetchMasterKpiTimeline(masterId);
  const [kpiTimeline, apiSummary, scenarioScriptSummaries] = await Promise.all([
    fetchMasterKpiTimelineBundle(masterId),
    fetchMasterApiSummary(masterId),
    fetchScenarioScriptSummaries(masterId).catch(() => []),
  ]);

  const created = master.created ? master.created * 1000 : Date.now();
  const ended = master.ended ? master.ended * 1000 : Date.now();
  const durationMinutes = Math.max(1, Math.round((ended - created) / 60000));

  const files: AnalysisFileBundle = {
    requestStats,
    errorStats,
    timeline,
  };

  const snapshot = buildBlazeMeterSnapshot({
    master,
    files,
    kpiTimeline,
    apiSummary,
    scenarioScriptSummaries,
  });

  return {
    masterId: String(master.id),
    runName: master.name?.trim() || `Run ${master.id}`,
    files,
    maxUsers: master.maxUsers ?? 0,
    durationMinutes,
    snapshot,
  };
}

export function isBlazeMeterImportError(err: unknown): err is BlazeMeterApiError {
  return Boolean(err && typeof err === "object" && (err as BlazeMeterApiError).name === "BlazeMeterApiError");
}
