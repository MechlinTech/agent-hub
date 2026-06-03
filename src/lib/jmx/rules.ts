import type { Finding, JmxInventory, ReviewConfig, Severity } from "@/lib/types";
import { RULE_TEMPLATES, enrichFinding } from "./templates";
import { getRuleIdsForPack } from "./rule-packs";

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const THRESHOLD_MAP: Record<string, Severity[]> = {
  critical: ["critical"],
  high: ["critical", "high"],
  medium: ["critical", "high", "medium"],
  low: ["critical", "high", "medium", "low"],
  all: ["critical", "high", "medium", "low", "info"],
};

function shouldInclude(severity: Severity, threshold: string): boolean {
  const allowed = THRESHOLD_MAP[threshold] ?? THRESHOLD_MAP.medium;
  return allowed.includes(severity);
}

function matchesCategory(category: string, selected: string[]): boolean {
  if (!selected.length || selected.includes("all")) return true;
  const map: Record<string, string[]> = {
    structure: ["Structure", "Maintainability"],
    assertions: ["Validation"],
    security: ["Security", "Correlation / Security"],
    thread_groups: ["Load Config", "Structure"],
    correlation: ["Correlation", "Correlation / Security", "Web Session"],
    data_files: ["Data Files", "Parameterization"],
    timers: ["Performance / Timers"],
    parameterization: ["Parameterization", "Environment"],
    cloud_readiness: ["BlazeMeter Readiness", "Debug", "Plugins"],
  };
  const allowed = selected.flatMap((s) => map[s] ?? [s]);
  return allowed.some((a) => category.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(category.toLowerCase()));
}

export function runRuleEngine(inventory: JmxInventory, config: ReviewConfig): Finding[] {
  const d = inventory.details;
  const triggered: string[] = [];

  if (d.genericTestPlanName) triggered.push("JMX-001");
  if (d.genericThreadGroupNames) triggered.push("JMX-002");
  if (d.noTimers) triggered.push("JMX-003");
  if (d.noAssertions) triggered.push("JMX-004");
  if (d.samplersWithoutAssertion.length > 0 && !d.noAssertions) triggered.push("JMX-005");
  if (d.hasViewResultsTree) triggered.push("JMX-006");
  if (d.hasLocalPaths) triggered.push("JMX-007");
  if (d.hasHardcodedBaseUrl) triggered.push("JMX-008");
  if (d.hasHardcodedBearer && config.includeSecurity) triggered.push("JMX-009");
  if (d.hasHardcodedPassword && config.includeSecurity) triggered.push("JMX-010");
  if (d.disabledCount > 0) triggered.push("JMX-012");
  if (d.noTransactionControllers) triggered.push("JMX-013");
  if (d.noCookieManager && config.testType === "web") triggered.push("JMX-014");
  if (d.noHeaderManager) triggered.push("JMX-015");
  if ((d.hasHardcodedBearer || d.hasHardcodedBaseUrl) && inventory.extractors < 2) triggered.push("JMX-016");
  if (inventory.threadGroups > 0) triggered.push("JMX-017");
  if (config.includeBlazeMeter && d.hasViewResultsTree) triggered.push("JMX-020");
  if (d.hasHardcodedBaseUrl) triggered.push("JMX-019");
  if (d.noCsvDataSet) triggered.push("JMX-011");

  const packRules = new Set(getRuleIdsForPack(config.rulePack));
  const disabledRules = new Set(config.disabledRules ?? []);
  const unique = Array.from(new Set(triggered)).filter(
    (id) => packRules.has(id) && !disabledRules.has(id)
  );
  let findings = unique
    .map((ruleId, i) => enrichFinding(RULE_TEMPLATES[ruleId], inventory, i))
    .filter((f) => matchesCategory(f.category, config.ruleCategories))
    .filter((f) => shouldInclude(f.severity, config.severityThreshold));

  findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  return findings;
}
