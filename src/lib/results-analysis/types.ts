export type AnalysisStatus =
  | "draft"
  | "uploading"
  | "ready"
  | "analyzing"
  | "completed"
  | "failed";

export type OverallStatus = "pass" | "warning" | "fail";
export type GoNoGo = "go" | "conditional_go" | "no_go";
export type TransactionStatus = "pass" | "warning" | "fail";
export type FindingSeverity = "critical" | "high" | "medium" | "low";

export interface TestContext {
  projectName: string;
  environment: string;
  buildVersion: string;
  testType: string;
  targetUsers: number;
  durationMinutes: number;
}

export interface SlaTransactionRule {
  id: string;
  transactionName: string;
  p95MaxSec: number;
  errorRateMaxPct: number;
  criticalFlow: boolean;
}

export interface SlaProfile {
  id: string;
  name: string;
  maxErrorRatePct: number;
  avgResponseTimeMaxSec: number;
  p90MaxSec: number;
  p95MaxSec: number;
  p99MaxSec: number;
  minThroughput: number;
  useDefaultWhenMissing: boolean;
  transactions: SlaTransactionRule[];
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadedFilesMeta {
  requestStats?: { name: string; size: number; valid: boolean };
  errorStats?: { name: string; size: number; valid: boolean };
  timeline?: { name: string; size: number; valid: boolean };
  baseline?: { name: string; size: number; valid: boolean };
  jtl?: { name: string; size: number; valid: boolean };
}

export interface ParsedTransaction {
  name: string;
  samples: number;
  avgRtSec: number;
  p90Sec: number;
  p95Sec: number;
  p99Sec: number;
  errorRatePct: number;
  throughput: number;
  minRtSec?: number;
  maxRtSec?: number;
  /** BlazeMeter aggregate report extras (API CSV) */
  labelId?: string;
  medianRtSec?: number;
  stDevSec?: number;
  durationSec?: number;
  /** Average bandwidth in KiB/s (BlazeMeter avgBytes column) */
  avgBytes?: number;
  errorsCount?: number;
  avgLatencySec?: number;
  concurrency?: number;
  passedThresholds?: boolean | null;
}

export interface ParsedErrorRow {
  transaction: string;
  errorCode: string;
  message: string;
  count: number;
  pctOfTotal: number;
  severity: FindingSeverity;
  possibleCause: string;
}

export interface FailedTransactionErrorEntry {
  errorCode: string;
  description: string;
  errorCount: number;
  responseBody?: string;
  labelId?: string;
}

export interface FailedTransactionDetail {
  name: string;
  apiUrl?: string;
  /** BlazeMeter Request Stats # Samples for this label */
  samples?: number;
  /** BlazeMeter error rate % for this label */
  errorRatePct?: number;
  errors: FailedTransactionErrorEntry[];
}

/** Per-label Request Stats row (BlazeMeter Request Stats tab) for one script/scenario */
export interface ScriptLabelStat {
  name: string;
  labelId?: string;
  /** BlazeMeter # Samples - HTTP request executions for this label */
  samples: number;
  avgResponseTimeMs?: number;
  avgHitsPerSec?: number;
  p90Ms?: number;
  p95Ms?: number;
  p99Ms?: number;
  minResponseTimeMs?: number;
  maxResponseTimeMs?: number;
  avgBandwidthKibps?: number;
  errorRatePct?: number;
  errorsCount?: number;
  /** True for the ALL / TOTAL summary row */
  isTotal?: boolean;
}

export interface ScriptSummaryRow {
  scriptName: string;
  result: "pass" | "fail";
  userLoad: number;
  /** BlazeMeter Request Stats # Samples (ALL row) for this script/scenario */
  totalSamples?: number;
  /** Samples that resulted in errors (ALL row errorsCount) */
  errorSamples?: number;
  /** All labels under this script - matches BlazeMeter Request Stats per scenario */
  labelStats?: ScriptLabelStat[];
  totalIterations: number;
  passIterations: number;
  failedIterations: number;
  failedTransactions: string[];
  failedTransactionDetails?: FailedTransactionDetail[];
  /** Manual defect tracking - editable per script in library / before export */
  bugId?: string;
  comments?: string;
}

export interface TechnicalFinding {
  id: string;
  transaction: string;
  status: TransactionStatus;
  finding: string;
  evidence: string[];
  possibleCause: string[];
  recommendation: string[];
  ownerTeam?: string;
  ownerName?: string;
  priority?: FindingSeverity;
  targetDate?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  ownerTeam: string;
  priority: FindingSeverity;
  status: "open" | "in_progress" | "done";
  dueDate?: string;
}

export type RootCauseCategory =
  | "latency"
  | "errors"
  | "throughput"
  | "stability"
  | "regression";

export interface RootCauseHypothesis {
  id: string;
  title: string;
  confidence: "high" | "medium" | "low";
  category: RootCauseCategory;
  summary: string;
  evidence: string[];
  affectedTransactions: string[];
  recommendedActions: string[];
}

export type PerformanceDefectType = "performance" | "functional" | "sla_breach";

export interface PerformanceDefect {
  id: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  transaction: string;
  errorCode?: string;
  type: PerformanceDefectType;
  status: "draft" | "ready";
  suggestedAssignee: string;
  labels: string[];
  rootCauseId?: string;
}

export interface ErrorAnalysisSummary {
  overallErrorRatePct: number;
  totalErrors: number;
  appErrors4xx: number;
  serverErrors5xx: number;
  baselineOverallErrorRatePct?: number;
  baselineTotalErrors?: number;
  baselineAppErrors4xx?: number;
  baselineServerErrors5xx?: number;
  errorsByTransaction: { name: string; count: number; pct: number }[];
  errorTrend: { time: string; errors: number; errorRatePct: number }[];
  errorRows: ParsedErrorRow[];
  aiInterpretation: string;
  keyInsight: string;
}

export interface BlazeMeterSnapshot {
  masterId: string;
  fetchedAt: string;
  master: {
    id: number;
    name: string;
    testId: number | null;
    created: number | null;
    ended: number | null;
    maxUsers: number | null;
    passed: boolean | null;
    note: string | null;
    durationMinutes: number;
    /** Active test duration from aggregate report (sec column), when available */
    activeDurationMinutes: number | null;
    createdAtIso: string;
    endedAtIso: string | null;
  };
  summary: {
    avgResponseTimeSec: number;
    p90ResponseTimeSec?: number;
    p95ResponseTimeSec: number;
    p99ResponseTimeSec?: number;
    minResponseTimeSec?: number;
    maxResponseTimeSec?: number;
    medianResponseTimeSec?: number;
    stDevSec?: number;
    errorRatePct: number;
    errorsCount?: number;
    throughput: number;
    totalSamples: number;
    durationSec?: number;
    avgBandwidthKiBps?: number;
    source: "total_row" | "aggregated";
  };
  transactions: ParsedTransaction[];
  totalRow: ParsedTransaction | null;
  errorRows: ParsedErrorRow[];
  timelinePoints: { time: string; errors: number; errorRatePct: number }[];
  kpiTimeline?: BlazeMeterKpiTimeline;
  apiSummary?: BlazeMeterApiSummary | null;
  /** Per-scenario script summaries for multi-script workflow runs (BlazeMeter import). */
  scenarioScriptSummaries?: ScriptSummaryRow[];
  /** Scenario id → display name mapping from BlazeMeter master API. */
  scenariosMapping?: Array<{
    id: string;
    name: string;
    internalName?: string;
    test?: string;
    isEndUserExperience?: boolean;
  }>;
  filesImported: {
    requestStats: boolean;
    errorStats: boolean;
    timeline: boolean;
  };
  reportStats: {
    requestStatsLines: number;
    errorStatsLines: number;
    timelineLines: number;
  };
}

export interface SummaryMetrics {
  maxUsers: number;
  durationMinutes: number;
  activeDurationMinutes?: number;
  avgResponseTimeSec: number;
  p90ResponseTimeSec?: number;
  p95ResponseTimeSec: number;
  p99ResponseTimeSec?: number;
  minResponseTimeSec?: number;
  maxResponseTimeSec?: number;
  medianResponseTimeSec?: number;
  stDevSec?: number;
  avgLatencySec?: number;
  errorRatePct: number;
  errorsCount?: number;
  throughput: number;
  totalSamples?: number;
  avgBandwidthKiBps?: number;
  durationSec?: number;
}

export interface KpiTimelinePoint {
  time: string;
  ts: number;
  value: number;
}

export interface BlazeMeterKpiTimeline {
  hitsPerSec: KpiTimelinePoint[];
  responseTimeMs: KpiTimelinePoint[];
  errors: KpiTimelinePoint[];
  bandwidthKiBps: KpiTimelinePoint[];
  activeThreads: KpiTimelinePoint[];
}

export interface BlazeMeterApiSummary {
  avgResponseTimeMs: number;
  hitsPerSec: number;
  tp90Ms: number;
  minMs: number;
  maxMs: number;
  totalBytes: number;
  failedCount: number;
  concurrency: number;
  durationSec: number;
}

export interface AnalysisResultPayload {
  overallStatus: OverallStatus;
  performanceScore: number;
  goNoGo: GoNoGo;
  executiveSummary: string;
  topRisks: string[];
  summaryMetrics: SummaryMetrics;
  scriptSummaries: ScriptSummaryRow[];
  transactions: ParsedTransaction[];
  findings: TechnicalFinding[];
  actionItems: ActionItem[];
  errorAnalysis: ErrorAnalysisSummary;
  scoreBreakdown: {
    slaScore: number;
    errorScore: number;
    throughputScore: number;
    stabilityScore: number;
    baselineScore: number;
  };
  baselineComparison?: {
    transaction: string;
    currentAvgRtSec: number;
    baselineAvgRtSec: number;
    deltaPct: number;
    currentErrorPct: number;
    baselineErrorPct: number;
  }[];
  rootCauseAnalysis: RootCauseHypothesis[];
  defects: PerformanceDefect[];
  aiEnhanced?: boolean;
}

export interface ResultsAnalysisRecord {
  id: string;
  externalId: string;
  runName: string;
  masterId: string | null;
  inputMethod: "csv" | "api" | "manual";
  status: AnalysisStatus;
  progressPercent: number;
  currentStep: string | null;
  testContext: TestContext;
  slaProfileId: string | null;
  uploadedFiles: UploadedFilesMeta;
  overallStatus: OverallStatus | null;
  performanceScore: number | null;
  goNoGo: GoNoGo | null;
  executiveSummary: string | null;
  topRisks: string[];
  resultPayload: AnalysisResultPayload | null;
  blazemeterSnapshot: BlazeMeterSnapshot | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutiveSummaryLibraryRecord {
  id: string;
  title: string;
  analysisId: string | null;
  externalAnalysisId: string | null;
  masterId: string | null;
  runName: string;
  environment: string | null;
  projectName: string | null;
  buildVersion: string | null;
  bugId: string;
  comments: string;
  scriptSummaries: ScriptSummaryRow[];
  scriptCount: number;
  passCount: number;
  failCount: number;
  exportedAt: string;
  updatedAt: string;
}
