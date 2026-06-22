import {
  parseErrorStatsCsv,
  parseRequestStatsBundle,
  parseRequestStatsCsv,
  parseTimelineCsv,
} from "./csv-parser";
import { DEFAULT_SLA_PROFILE } from "./defaults";
import { buildAnalysisResult } from "./executive";
import { enhanceAnalysisWithAi } from "./ai-summaries";
import type {
  AnalysisResultPayload,
  SlaProfile,
  TestContext,
  UploadedFilesMeta,
} from "./types";

export interface AnalysisFileBundle {
  requestStats?: string;
  errorStats?: string;
  timeline?: string;
  baseline?: string;
}

export interface RunAnalysisInput {
  runName: string;
  context: TestContext;
  files: AnalysisFileBundle;
  slaProfile?: SlaProfile;
  scenarioScriptSummaries?: import("./types").ScriptSummaryRow[];
  aiRecommendationEnabled?: boolean;
  onProgress?: (step: string, percent: number) => Promise<void> | void;
}

export async function runResultsAnalysis(
  input: RunAnalysisInput
): Promise<AnalysisResultPayload> {
  const slaProfile = input.slaProfile ?? DEFAULT_SLA_PROFILE;
  const steps = [
    "Fetching summary metrics",
    "Fetching request statistics",
    "Fetching error statistics",
    "Checking SLA thresholds",
    "Comparing with baseline",
    "Detecting bottlenecks",
    "Generating root-cause hypothesis",
    "Creating action items",
    "Generating executive summary",
  ];

  let stepIndex = 0;
  async function progress(label: string) {
    const percent = Math.round(((stepIndex + 1) / steps.length) * 100);
    await input.onProgress?.(label, percent);
    stepIndex += 1;
  }

  await progress(steps[0]);
  if (!input.files.requestStats) {
    throw new Error("Request Stats CSV is required.");
  }

  await progress(steps[1]);
  const requestBundle = parseRequestStatsBundle(input.files.requestStats);
  const transactions = requestBundle.transactions;
  if (transactions.length === 0 && !requestBundle.totalRow) {
    throw new Error("No transactions found in Request Stats CSV.");
  }

  await progress(steps[2]);
  const errorRows = input.files.errorStats
    ? parseErrorStatsCsv(input.files.errorStats)
    : [];

  await progress(steps[3]);
  const timeline = input.files.timeline ? parseTimelineCsv(input.files.timeline) : null;

  await progress(steps[4]);
  const baselineTransactions = input.files.baseline
    ? parseRequestStatsCsv(input.files.baseline)
    : undefined;

  await progress(steps[5]);
  await progress(steps[6]);
  await progress(steps[7]);

  const scriptSummaries =
    input.scenarioScriptSummaries && input.scenarioScriptSummaries.length > 0
      ? input.scenarioScriptSummaries
      : timeline?.scriptSummaries.length
        ? timeline.scriptSummaries
        : [];

  const result = buildAnalysisResult({
    runName: input.runName,
    context: input.context,
    slaProfile,
    transactions,
    totalRow: requestBundle.totalRow,
    errorRows,
    scriptSummaries,
    scenarioScriptSummaries: input.scenarioScriptSummaries,
    errorTrend: timeline?.errorTrend ?? [],
    baselineTransactions,
  });

  await progress(steps[8]);
  return enhanceAnalysisWithAi(result, {
    runName: input.runName,
    testContext: input.context,
    aiRecommendationEnabled: input.aiRecommendationEnabled,
  });
}

export function buildUploadedFilesMeta(
  files: Partial<Record<keyof AnalysisFileBundle, { name: string; size: number }>>,
  contents: AnalysisFileBundle
): UploadedFilesMeta {
  return {
    requestStats: files.requestStats
      ? {
          name: files.requestStats.name,
          size: files.requestStats.size,
          valid: Boolean(contents.requestStats && parseRequestStatsBundle(contents.requestStats).transactions.length),
        }
      : undefined,
    errorStats: files.errorStats
      ? {
          name: files.errorStats.name,
          size: files.errorStats.size,
          valid: Boolean(contents.errorStats),
        }
      : undefined,
    timeline: files.timeline
      ? {
          name: files.timeline.name,
          size: files.timeline.size,
          valid: Boolean(contents.timeline),
        }
      : undefined,
    baseline: files.baseline
      ? {
          name: files.baseline.name,
          size: files.baseline.size,
          valid: Boolean(contents.baseline),
        }
      : undefined,
  };
}

export function generateAnalysisId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `RA-${y}-${m}-${d}-${h}${min}`;
}
