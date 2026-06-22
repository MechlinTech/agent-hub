import type {
  PerformanceDefect,
  PerformanceDefectType,
  RootCauseHypothesis,
  TechnicalFinding,
  TestContext,
} from "./types";
import type { ParsedErrorRow } from "./types";

interface DefectInput {
  findings: TechnicalFinding[];
  errorRows: ParsedErrorRow[];
  rootCauseAnalysis: RootCauseHypothesis[];
  context: TestContext;
  runName: string;
}

function severityFromFinding(status: TechnicalFinding["status"]): PerformanceDefect["severity"] {
  if (status === "fail") return "high";
  if (status === "warning") return "medium";
  return "low";
}

function defectType(finding: TechnicalFinding, errorCode?: string): PerformanceDefectType {
  if (finding.status !== "pass") return "sla_breach";
  if (errorCode?.startsWith("4") || errorCode?.startsWith("5")) return "functional";
  return "performance";
}

function buildDescription(
  finding: TechnicalFinding,
  context: TestContext,
  runName: string,
  rca?: RootCauseHypothesis
): string {
  const lines = [
    `*Performance test:* ${runName}`,
    `*Environment:* ${context.environment} | Build ${context.buildVersion}`,
    `*Transaction:* ${finding.transaction}`,
    "",
    finding.finding,
    "",
    "*Evidence:*",
    ...finding.evidence.map((e) => `- ${e}`),
  ];
  if (finding.recommendation.length) {
    lines.push("", "*Recommended actions:*", ...finding.recommendation.map((r) => `- ${r}`));
  }
  if (rca) {
    lines.push("", `*Related root cause:* ${rca.title}`, rca.summary);
  }
  return lines.join("\n");
}

function findRelatedRca(
  transaction: string,
  rootCauseAnalysis: RootCauseHypothesis[]
): RootCauseHypothesis | undefined {
  return rootCauseAnalysis.find((rca) =>
    rca.affectedTransactions.some((t) => t.toLowerCase() === transaction.toLowerCase())
  );
}

export function generatePerformanceDefects(input: DefectInput): PerformanceDefect[] {
  const defects: PerformanceDefect[] = [];
  const seen = new Set<string>();

  for (const finding of input.findings.filter((f) => f.status !== "pass")) {
    const key = `finding-${finding.transaction}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const rca = findRelatedRca(finding.transaction, input.rootCauseAnalysis);
    defects.push({
      id: `defect-${defects.length + 1}`,
      title: `[Perf] ${finding.transaction}: ${finding.status === "fail" ? "SLA failure" : "SLA warning"}`,
      description: buildDescription(finding, input.context, input.runName, rca),
      severity: severityFromFinding(finding.status),
      transaction: finding.transaction,
      type: defectType(finding),
      status: "ready",
      suggestedAssignee: finding.ownerName ?? finding.ownerTeam ?? "Performance Team",
      labels: ["performance", "load-test", input.context.environment.toLowerCase()],
      rootCauseId: rca?.id,
    });
  }

  const topErrors = [...input.errorRows].sort((a, b) => b.count - a.count).slice(0, 5);
  for (const row of topErrors) {
    if (row.severity === "low" && row.count < 10) continue;
    const key = `error-${row.transaction}-${row.errorCode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const rca = findRelatedRca(row.transaction, input.rootCauseAnalysis);
    defects.push({
      id: `defect-${defects.length + 1}`,
      title: `[Error ${row.errorCode}] ${row.transaction}: ${row.count} occurrences`,
      description: [
        `*Performance test:* ${input.runName}`,
        `*Environment:* ${input.context.environment}`,
        "",
        `Error ${row.errorCode}: ${row.message}`,
        `Count: ${row.count}`,
        row.possibleCause ? `Possible cause: ${row.possibleCause}` : "",
        rca ? `\nRelated root cause: ${rca.title}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      severity: row.severity,
      transaction: row.transaction,
      errorCode: row.errorCode,
      type: row.errorCode.startsWith("4") || row.errorCode.startsWith("5") ? "functional" : "performance",
      status: "ready",
      suggestedAssignee: "Dev Lead",
      labels: ["performance", "error", row.errorCode, input.context.environment.toLowerCase()],
      rootCauseId: rca?.id,
    });
  }

  return defects.slice(0, 15);
}

export function defectsToJiraPayload(defects: PerformanceDefect[], projectKey = "PERF") {
  return defects.map((d) => ({
    fields: {
      project: { key: projectKey },
      summary: d.title,
      description: d.description,
      issuetype: { name: "Bug" },
      priority: { name: d.severity === "critical" ? "Highest" : d.severity === "high" ? "High" : "Medium" },
      labels: d.labels,
    },
    meta: {
      defectId: d.id,
      transaction: d.transaction,
      errorCode: d.errorCode,
      suggestedAssignee: d.suggestedAssignee,
      rootCauseId: d.rootCauseId,
    },
  }));
}
