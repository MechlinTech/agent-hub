import type { SlaProfile, TestContext } from "./types";

export const DEFAULT_TEST_CONTEXT: TestContext = {
  projectName: "US GMR",
  environment: "PreProd",
  buildVersion: "1.0.0",
  testType: "Load",
  targetUsers: 500,
  durationMinutes: 60,
};

export const DEFAULT_SLA_PROFILE: SlaProfile = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "PreProd - Standard SLA",
  maxErrorRatePct: 2,
  avgResponseTimeMaxSec: 2,
  p90MaxSec: 3,
  p95MaxSec: 4,
  p99MaxSec: 6,
  minThroughput: 120,
  useDefaultWhenMissing: true,
  isDefault: true,
  transactions: [
    {
      id: "00000000-0000-4000-8000-000000000011",
      transactionName: "Login",
      p95MaxSec: 2,
      errorRateMaxPct: 1,
      criticalFlow: true,
    },
    {
      id: "00000000-0000-4000-8000-000000000012",
      transactionName: "Search Claim",
      p95MaxSec: 3,
      errorRateMaxPct: 1,
      criticalFlow: true,
    },
    {
      id: "00000000-0000-4000-8000-000000000013",
      transactionName: "Save Estimate",
      p95MaxSec: 4,
      errorRateMaxPct: 2,
      criticalFlow: false,
    },
    {
      id: "00000000-0000-4000-8000-000000000014",
      transactionName: "Document Upload",
      p95MaxSec: 5,
      errorRateMaxPct: 2,
      criticalFlow: false,
    },
  ],
};

export const ANALYSIS_STEPS = [
  "Fetching summary metrics",
  "Fetching request statistics",
  "Fetching error statistics",
  "Checking SLA thresholds",
  "Comparing with baseline",
  "Detecting bottlenecks",
  "Generating root-cause hypothesis",
  "Creating action items",
  "Generating executive summary",
] as const;
