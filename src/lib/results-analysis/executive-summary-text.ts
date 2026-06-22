import type { GoNoGo, ScriptSummaryRow, TestContext } from "./types";

export function buildExecutiveIntro(input: {
  runName: string;
  context: TestContext;
  score: number;
  scriptSummaries: ScriptSummaryRow[];
}): string {
  const scriptNote =
    input.scriptSummaries.length > 0
      ? ` Script-level review shows ${input.scriptSummaries.filter((s) => s.failedIterations > 0).length} script(s) with failed iterations.`
      : "";
  return (
    `Analysis for ${input.runName} (${input.context.projectName} | ${input.context.environment} | Build ${input.context.buildVersion}) ` +
    `completed with a performance score of ${input.score}/100.${scriptNote}`
  );
}

export function buildExecutiveRecommendation(goNoGo: GoNoGo): string {
  return `Recommendation: ${goNoGo.replace("_", " ").toUpperCase()}. Review technical findings before release sign-off.`;
}

export function stripExecutiveTransactionWall(text: string): {
  intro: string;
  recommendation: string;
} {
  const recMatch = text.match(/\s*Recommendation:\s*.+$/i);
  const recommendation = recMatch ? recMatch[0].trim() : "";
  let intro = recMatch ? text.slice(0, recMatch.index).trim() : text;

  const txMarker = " Key transactions requiring attention:";
  const txIdx = intro.indexOf(txMarker);
  if (txIdx !== -1) {
    intro = intro.slice(0, txIdx).trim();
  }

  return { intro, recommendation };
}

export function buildExecutiveSummaryText(input: {
  runName: string;
  context: TestContext;
  score: number;
  goNoGo: GoNoGo;
  scriptSummaries: ScriptSummaryRow[];
}): string {
  return `${buildExecutiveIntro(input)} ${buildExecutiveRecommendation(input.goNoGo)}`;
}
