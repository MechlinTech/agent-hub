import { RULE_TEMPLATES } from "@/lib/jmx/templates";
import { ALL_RULE_IDS } from "@/lib/jmx/rule-packs";
import type { Severity } from "@/lib/types";

export interface RuleCatalogEntry {
  id: string;
  issue: string;
  category: string;
  severity: Severity;
  element: string;
}

export const RULE_CATEGORY_OPTIONS = [
  { id: "structure", label: "Structure", desc: "Test plan and element organization" },
  { id: "assertions", label: "Assertions", desc: "Response validation coverage" },
  { id: "security", label: "Security", desc: "Secrets and auth patterns" },
  { id: "thread_groups", label: "Thread Groups", desc: "Load and duration config" },
  { id: "correlation", label: "Correlation", desc: "Dynamic values and extractors" },
  { id: "data_files", label: "Data Files", desc: "CSV and data paths" },
  { id: "timers", label: "Timers", desc: "Think time and pacing" },
  { id: "parameterization", label: "Parameterization", desc: "Variables and properties" },
  { id: "cloud_readiness", label: "Cloud Readiness", desc: "BlazeMeter compatibility" },
] as const;

export function getRuleCatalog(): RuleCatalogEntry[] {
  return ALL_RULE_IDS.filter((id) => RULE_TEMPLATES[id]).map((id) => {
    const t = RULE_TEMPLATES[id];
    return {
      id,
      issue: t.issue,
      category: t.category,
      severity: t.severity,
      element: t.element,
    };
  });
}

export function categoryIdForRuleCategory(category: string): string | null {
  const map: Record<string, string> = {
    Structure: "structure",
    Maintainability: "structure",
    Validation: "assertions",
    Security: "security",
    "Correlation / Security": "security",
    "Load Config": "thread_groups",
    Correlation: "correlation",
    "Web Session": "correlation",
    "Data Files": "data_files",
    "Performance / Timers": "timers",
    Parameterization: "parameterization",
    Environment: "parameterization",
    "BlazeMeter Readiness": "cloud_readiness",
    Debug: "cloud_readiness",
    Plugins: "cloud_readiness",
    Headers: "structure",
  };
  return map[category] ?? null;
}
