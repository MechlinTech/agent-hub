export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type ReadinessStatus = "ready" | "ready_minor" | "not_ready" | "high_risk" | "failed";
export type ReviewStatus = "pending" | "parsing" | "scanning" | "scoring" | "completed" | "failed";
export type FindingStatus = "open" | "in_progress" | "acknowledged" | "resolved" | "wont_fix";
export type AiRecommendationMode = "disabled" | "enabled";

export interface JmxInventory {
  testPlanName: string;
  threadGroups: number;
  httpSamplers: number;
  transactionControllers: number;
  assertions: number;
  timers: number;
  csvDataSets: number;
  extractors: number;
  listeners: number;
  headerManagers: number;
  cookieManagers: number;
  configElements: number;
  disabledElements: number;
  variables: number;
  details: {
    threadGroupNames: string[];
    samplerNames: string[];
    hasViewResultsTree: boolean;
    hasLocalPaths: boolean;
    hasHardcodedBearer: boolean;
    hasHardcodedPassword: boolean;
    hasHardcodedBaseUrl: boolean;
    samplersWithoutAssertion: string[];
    genericThreadGroupNames: boolean;
    genericTestPlanName: boolean;
    noTransactionControllers: boolean;
    noCookieManager: boolean;
    noHeaderManager: boolean;
    noTimers: boolean;
    noAssertions: boolean;
    noCsvDataSet: boolean;
    disabledCount: number;
    localPathExamples: string[];
    bearerTokenSnippet?: string;
    passwordSnippet?: string;
  };
}

export interface Finding {
  ruleId: string;
  findingCode: string;
  severity: Severity;
  category: string;
  element: string;
  issue: string;
  impact: string;
  recommendation: string;
  whyItMatters: string;
  detectedValue?: string;
  locationPath?: string;
  codeSnippet?: string;
  fixPatternCurrent?: string;
  fixPatternRecommended?: string;
  tags?: string[];
  aiEnhanced?: boolean;
}

export interface ReviewResult {
  score: number;
  readiness: ReadinessStatus;
  readinessLabel: string;
  executiveSummary: string;
  inventory: JmxInventory;
  findings: Finding[];
  topRisks: string[];
  fixOrder: string[];
  severityCounts: Record<Severity, number>;
}

export interface ReviewConfig {
  testType: "web" | "api";
  rulePack: string;
  includeSecurity: boolean;
  includeBlazeMeter: boolean;
  severityThreshold: string;
  environment: string;
  slaProfile: string;
  ruleCategories: string[];
  disabledRules?: string[];
  aiRecommendationMode: AiRecommendationMode;
  hasCsvAttachment?: boolean;
  csvValidationWarnings?: string[];
}
