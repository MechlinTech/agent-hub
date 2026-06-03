import type { Finding, JmxInventory, ReviewConfig, ReviewResult } from "@/lib/types";
import { parseJmx } from "./parser";
import { runRuleEngine } from "./rules";
import { buildReviewResult } from "./scoring";

export async function runJmxReview(
  xmlContent: string,
  fileName: string,
  config: ReviewConfig,
  reviewId?: string
): Promise<ReviewResult> {
  const inventory = parseJmx(xmlContent, fileName);
  let findings = runRuleEngine(inventory, config);
  let aiEnhanced = false;
  let executiveSummaryOverride: string | null = null;

  if (config.aiRecommendationMode === "enabled") {
    try {
      const preliminary = buildReviewResult(inventory, findings, fileName, false);
      const res = await fetch("/api/ai/enhance-findings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          findings,
          scriptName: fileName,
          inventory,
          environment: config.environment,
          slaProfile: config.slaProfile,
          generateSummary: true,
          score: preliminary.score,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        findings = (data.findings as Finding[]).map((f) => ({ ...f, aiEnhanced: true }));
        executiveSummaryOverride = data.executiveSummary ?? null;
        aiEnhanced = true;
      }
    } catch {
      // Keep template findings
    }
  }

  let result = buildReviewResult(inventory, findings, fileName, aiEnhanced);
  if (executiveSummaryOverride) {
    result = { ...result, executiveSummary: executiveSummaryOverride };
  }
  return result;
}

export const ANALYSIS_STEPS = [
  { id: "parsing", label: "Parsing JMX", ai: false },
  { id: "inventory", label: "Inventory Extraction", ai: false },
  { id: "rules", label: "Rule Engine Scan", ai: false },
  { id: "ai", label: "AI Explanation Layer", ai: true },
  { id: "report", label: "Final Scoring & Report", ai: false },
] as const;
