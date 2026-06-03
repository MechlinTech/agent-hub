import type { Finding, JmxInventory } from "@/lib/types";
import {
  chatCompletion,
  getAiStatus,
  isAiConfigured,
  parseJsonFromModel,
  providerLabel,
  resolveActiveProvider,
} from "@/lib/ai/providers";

export { isAiConfigured, getAiStatus };

export function getAiModel(): string {
  return resolveActiveProvider()?.model ?? "none";
}

export function getActiveProviderLabel(): string {
  const active = resolveActiveProvider();
  return active ? providerLabel(active.provider) : "None";
}

interface EnhanceContext {
  scriptName: string;
  inventory: JmxInventory;
  environment: string;
  slaProfile: string;
}

/**
 * Enhances rule-engine findings with AI explanations (OpenAI, Gemini, or Groq).
 * Falls back to original finding text if API unavailable or fails.
 */
export async function enhanceFindingsWithAI(
  findings: Finding[],
  context: EnhanceContext
): Promise<Finding[]> {
  if (!isAiConfigured()) {
    throw new Error(
      "No AI provider configured. Set OPENAI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY on the server."
    );
  }

  const enhanced: Finding[] = [];

  for (const finding of findings) {
    try {
      const prompt = `You are a JMeter performance engineering expert. Enhance this script review finding with clearer impact and actionable fix guidance.

Script: ${context.scriptName}
Environment: ${context.environment}
SLA Profile: ${context.slaProfile}
Thread Groups: ${context.inventory.threadGroups}
HTTP Samplers: ${context.inventory.httpSamplers}

Finding:
- Rule: ${finding.ruleId}
- Severity: ${finding.severity}
- Element: ${finding.element}
- Issue: ${finding.issue}

Respond in JSON only:
{
  "impact": "2-3 sentences on BlazeMeter/load test impact",
  "recommendation": "specific JMeter fix steps",
  "whyItMatters": "business/technical rationale",
  "fixPatternRecommended": "optional JMeter config snippet or null"
}`;

      const text = await chatCompletion(prompt);
      const parsed = parseJsonFromModel(text) as {
        impact?: string;
        recommendation?: string;
        whyItMatters?: string;
        fixPatternRecommended?: string | null;
      };

      enhanced.push({
        ...finding,
        impact: parsed.impact ?? finding.impact,
        recommendation: parsed.recommendation ?? finding.recommendation,
        whyItMatters: parsed.whyItMatters ?? finding.whyItMatters,
        fixPatternRecommended: parsed.fixPatternRecommended ?? finding.fixPatternRecommended,
        tags: [...(finding.tags ?? []), "ai-enhanced"],
      });
    } catch {
      enhanced.push(finding);
    }
  }

  return enhanced;
}

export async function generateAiExecutiveSummary(
  scriptName: string,
  score: number,
  findings: Finding[]
): Promise<string | null> {
  if (!isAiConfigured()) return null;

  const critical = findings.filter((f) => f.severity === "critical").length;
  const high = findings.filter((f) => f.severity === "high").length;

  try {
    const text = await chatCompletion(
      `Write a 3-sentence executive summary for a JMeter script review.
Script: ${scriptName}, Score: ${score}/100, Critical: ${critical}, High: ${high}.
Top issues: ${findings.slice(0, 3).map((f) => f.issue).join("; ")}`,
      "Write concise professional prose. No JSON, no bullet lists."
    );
    return text.trim() || null;
  } catch {
    return null;
  }
}
