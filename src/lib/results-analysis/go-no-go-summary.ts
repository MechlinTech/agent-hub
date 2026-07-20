import type { AnalysisResultPayload, GoNoGo, ScriptSummaryRow } from "./types";

export function buildGoNoGoRationale(
  result: AnalysisResultPayload,
  scriptSummaries: ScriptSummaryRow[]
): { headline: string; bullets: string[]; guidance: string } {
  const m = result.summaryMetrics;
  const failedScripts = scriptSummaries.filter((s) => s.failedIterations > 0).length;
  const failFindings = result.findings.filter((f) => f.status === "fail").length;
  const warningFindings = result.findings.filter((f) => f.status === "warning").length;

  const bullets: string[] = [];

  if (result.performanceScore < 50) {
    bullets.push(
      `Performance score ${result.performanceScore}/100 is below the 50-point release threshold.`
    );
  } else if (result.performanceScore < 75) {
    bullets.push(
      `Performance score ${result.performanceScore}/100 is in the caution range (below 75).`
    );
  } else {
    bullets.push(`Performance score ${result.performanceScore}/100 meets the target range.`);
  }

  if (result.overallStatus === "fail") {
    bullets.push("Overall status is Fail based on SLA and error thresholds.");
  } else if (result.overallStatus === "warning") {
    bullets.push("Overall status is Warning - some metrics are near or beyond limits.");
  } else {
    bullets.push("Overall status is Pass against configured SLA thresholds.");
  }

  if (failedScripts > 0) {
    bullets.push(
      `${failedScripts} of ${scriptSummaries.length || failedScripts} script(s) reported failed iterations.`
    );
  }

  if (m.errorRatePct > 0) {
    bullets.push(`Aggregate error rate is ${m.errorRatePct.toFixed(2)}%.`);
  }

  if (failFindings > 0) {
    bullets.push(`${failFindings} transaction(s) failed SLA evaluation.`);
  } else if (warningFindings > 0) {
    bullets.push(`${warningFindings} transaction(s) are in SLA warning state.`);
  }

  const guidanceByGoNoGo: Record<GoNoGo, string> = {
    no_go:
      "Do not promote this build. Resolve failing scripts and re-run the load test before release sign-off.",
    conditional_go:
      "Proceed only after reviewing open risks, failed scripts, and agreed mitigation with stakeholders.",
    go: "Metrics support release. Continue monitoring in pre-production and production-like environments.",
  };

  const headlineByGoNoGo: Record<GoNoGo, string> = {
    no_go: "This build is not recommended for release.",
    conditional_go: "Release may proceed with conditions and explicit stakeholder approval.",
    go: "This build meets release criteria based on current load test results.",
  };

  return {
    headline: headlineByGoNoGo[result.goNoGo],
    bullets,
    guidance: guidanceByGoNoGo[result.goNoGo],
  };
}
