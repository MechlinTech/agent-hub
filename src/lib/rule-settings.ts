import { RULE_CATEGORY_OPTIONS } from "@/lib/jmx/rule-catalog";
import type { ReviewConfig } from "@/lib/types";

export interface UserRuleConfig {
  rulePack: string;
  testType: "web" | "api";
  severityThreshold: string;
  includeSecurity: boolean;
  includeBlazeMeter: boolean;
  ruleCategories: string[];
  disabledRules: string[];
}

export const DEFAULT_USER_RULE_CONFIG: UserRuleConfig = {
  rulePack: "BlazeMeter Best Practices v3.2",
  testType: "web",
  severityThreshold: "medium",
  includeSecurity: true,
  includeBlazeMeter: true,
  ruleCategories: RULE_CATEGORY_OPTIONS.map((c) => c.id),
  disabledRules: [],
};

export function parseUserRuleConfig(raw: unknown): UserRuleConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_USER_RULE_CONFIG };
  const o = raw as Partial<UserRuleConfig>;
  return {
    rulePack: o.rulePack ?? DEFAULT_USER_RULE_CONFIG.rulePack,
    testType: o.testType === "api" ? "api" : "web",
    severityThreshold: o.severityThreshold ?? DEFAULT_USER_RULE_CONFIG.severityThreshold,
    includeSecurity: o.includeSecurity ?? DEFAULT_USER_RULE_CONFIG.includeSecurity,
    includeBlazeMeter: o.includeBlazeMeter ?? DEFAULT_USER_RULE_CONFIG.includeBlazeMeter,
    ruleCategories: Array.isArray(o.ruleCategories)
      ? o.ruleCategories.filter((c): c is string => typeof c === "string")
      : [...DEFAULT_USER_RULE_CONFIG.ruleCategories],
    disabledRules: Array.isArray(o.disabledRules)
      ? o.disabledRules.filter((r): r is string => typeof r === "string")
      : [],
  };
}

/** Merge saved rule defaults into a review config (AI mode handled separately). */
export function applyUserRuleDefaults(
  ruleConfig: UserRuleConfig,
  aiRecommendationMode: ReviewConfig["aiRecommendationMode"] = "disabled"
): Omit<ReviewConfig, "hasCsvAttachment" | "csvValidationWarnings"> {
  return {
    testType: ruleConfig.testType,
    rulePack: ruleConfig.rulePack,
    includeSecurity: ruleConfig.includeSecurity,
    includeBlazeMeter: ruleConfig.includeBlazeMeter,
    severityThreshold: ruleConfig.severityThreshold,
    environment: "QA",
    slaProfile: "Web - Standard (99th < 2s, Error < 1%)",
    ruleCategories: ruleConfig.ruleCategories,
    disabledRules: ruleConfig.disabledRules,
    aiRecommendationMode,
  };
}

export function isRuleEnabled(ruleId: string, disabledRules: string[]): boolean {
  return !disabledRules.includes(ruleId);
}

export function toggleRule(disabledRules: string[], ruleId: string, enabled: boolean): string[] {
  if (enabled) return disabledRules.filter((id) => id !== ruleId);
  if (disabledRules.includes(ruleId)) return disabledRules;
  return [...disabledRules, ruleId];
}
