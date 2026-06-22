import { chatCompletion, isAiConfigured } from "@/lib/ai/providers";
import type { AnalysisResultPayload, TestContext } from "./types";

export async function enhanceAnalysisWithAi(
  result: AnalysisResultPayload,
  context: {
    runName: string;
    testContext: TestContext;
    aiRecommendationEnabled?: boolean;
  }
): Promise<AnalysisResultPayload> {
  if (!context.aiRecommendationEnabled) return result;
  if (!isAiConfigured()) return result;
  try {
    const prompt = JSON.stringify(
      {
        runName: context.runName,
        environment: context.testContext.environment,
        buildVersion: context.testContext.buildVersion,
        overallStatus: result.overallStatus,
        performanceScore: result.performanceScore,
        goNoGo: result.goNoGo,
        topRisks: result.topRisks,
        errorRatePct: result.summaryMetrics.errorRatePct,
        topErrors: result.errorAnalysis.errorRows.slice(0, 5).map((r) => ({
          transaction: r.transaction,
          code: r.errorCode,
          count: r.count,
        })),
        rootCauses: result.rootCauseAnalysis.slice(0, 3).map((r) => r.title),
      },
      null,
      2
    );

    const raw = await chatCompletion(
      `Analyze this load test result and respond with JSON:\n${prompt}\n\nRequired JSON shape:\n{"executiveSummary":"2-3 sentence executive summary for leadership","errorInterpretation":"1-2 sentences on error patterns","keyInsight":"one actionable insight"}`,
      "You are a performance engineering analyst. Respond with valid JSON only. No markdown."
    );

    const parsed = JSON.parse(
      raw.replace(/```json\n?|\n?```/g, "").trim()
    ) as {
      executiveSummary?: string;
      errorInterpretation?: string;
      keyInsight?: string;
    };

    return {
      ...result,
      aiEnhanced: true,
      executiveSummary: parsed.executiveSummary?.trim() || result.executiveSummary,
      errorAnalysis: {
        ...result.errorAnalysis,
        aiInterpretation:
          parsed.errorInterpretation?.trim() || result.errorAnalysis.aiInterpretation,
        keyInsight: parsed.keyInsight?.trim() || result.errorAnalysis.keyInsight,
      },
    };
  } catch {
    return result;
  }
}
