import type { Finding, ReadinessStatus, ReviewResult, Severity } from "@/lib/types";
import type { JmxInventory } from "@/lib/types";

const CATEGORY_WEIGHTS: Record<string, number> = {
  "Correlation / Security": 20,
  Security: 20,
  Parameterization: 15,
  "Data Files": 15,
  Validation: 15,
  "Performance / Timers": 15,
  "Load Config": 10,
  Structure: 10,
  "BlazeMeter Readiness": 10,
  Debug: 10,
  Environment: 5,
  Maintainability: 5,
  Headers: 5,
  "Web Session": 10,
  Correlation: 20,
  Plugins: 5,
};

const SEVERITY_DEDUCTION: Record<Severity, number> = {
  critical: 15,
  high: 8,
  medium: 4,
  low: 1,
  info: 0,
};

function categoryForFinding(f: Finding): string {
  return f.category;
}

export function calculateScore(findings: Finding[]): number {
  if (!findings.length) return 100;

  const categoryScores: Record<string, number> = {};
  let totalWeight = 0;

  for (const [cat, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    categoryScores[cat] = 100;
    totalWeight += weight;
  }

  for (const f of findings) {
    const cat = categoryForFinding(f);
    const matchedKey =
      Object.keys(categoryScores).find(
        (k) => cat.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(cat.toLowerCase())
      ) ?? "Structure";
    categoryScores[matchedKey] = Math.max(0, (categoryScores[matchedKey] ?? 100) - SEVERITY_DEDUCTION[f.severity]);
  }

  let weightedSum = 0;
  for (const [cat, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    weightedSum += (categoryScores[cat] ?? 100) * weight;
  }

  const score = Math.round(weightedSum / totalWeight);

  // Also apply simple floor from critical count
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const capped = Math.max(0, score - criticalCount * 2);

  return Math.max(0, Math.min(100, capped));
}

export function scoreToReadiness(score: number): ReadinessStatus {
  if (score >= 85) return "ready";
  if (score >= 70) return "ready_minor";
  if (score >= 50) return "not_ready";
  return "high_risk";
}

export function buildFixOrder(findings: Finding[]): string[] {
  const priority = [
    "JMX-009", "JMX-010", "JMX-007", "JMX-011", "JMX-004", "JMX-005",
    "JMX-003", "JMX-006", "JMX-008", "JMX-019", "JMX-002", "JMX-012",
  ];
  const ordered: string[] = [];
  priority.forEach((id) => {
    const f = findings.find((x) => x.ruleId === id);
    if (f) ordered.push(`${ordered.length + 1}. ${f.recommendation}`);
  });
  findings
    .filter((f) => !priority.includes(f.ruleId))
    .forEach((f) => ordered.push(`${ordered.length + 1}. ${f.recommendation}`));
  return ordered.slice(0, 10);
}

export function buildTopRisks(findings: Finding[]): string[] {
  return findings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .slice(0, 5)
    .map((f) => f.issue);
}

export function buildExecutiveSummary(
  score: number,
  readiness: ReadinessStatus,
  findings: Finding[],
  scriptName: string,
  aiEnhanced?: boolean
): string {
  const critical = findings.filter((f) => f.severity === "critical").length;
  const high = findings.filter((f) => f.severity === "high").length;
  const statusText =
    readiness === "ready"
      ? "ready for load execution"
      : readiness === "ready_minor"
        ? "ready with minor fixes recommended"
        : "not ready for reliable load execution";

  const aiNote = aiEnhanced ? " AI-enhanced recommendations were applied." : "";

  return (
    `Script "${scriptName}" scored ${score}/100 and is ${statusText}. ` +
    `The review found ${findings.length} issue(s) including ${critical} critical and ${high} high severity findings.` +
    aiNote +
    (critical > 0
      ? " Address critical security and correlation issues before BlazeMeter execution."
      : high > 0
        ? " Resolve high-severity pacing and validation gaps before baseline testing."
        : " Review medium findings to improve maintainability and cloud readiness.")
  );
}

export function buildReviewResult(
  inventory: JmxInventory,
  findings: Finding[],
  scriptName: string,
  aiEnhanced?: boolean
): ReviewResult {
  const score = calculateScore(findings);
  const readiness = scoreToReadiness(score);
  const labels: Record<ReadinessStatus, string> = {
    ready: "Ready for Load Execution",
    ready_minor: "Ready with Minor Changes",
    not_ready: "Not Ready for BlazeMeter Execution",
    high_risk: "High Risk — Rebuild Recommended",
    failed: "Review Failed",
  };

  const severityCounts: Record<Severity, number> = {
    critical: 0, high: 0, medium: 0, low: 0, info: 0,
  };
  findings.forEach((f) => severityCounts[f.severity]++);

  return {
    score,
    readiness,
    readinessLabel: labels[readiness],
    executiveSummary: buildExecutiveSummary(score, readiness, findings, scriptName, aiEnhanced),
    inventory,
    findings,
    topRisks: buildTopRisks(findings),
    fixOrder: buildFixOrder(findings),
    severityCounts,
  };
}
