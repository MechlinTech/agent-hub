import type { LucideIcon } from "lucide-react";
import {
  Database,
  FileBarChart,
  FileSearch,
  GitBranch,
  LineChart,
  Play,
  Search,
  SlidersHorizontal,
} from "lucide-react";

export type AgentStatus = "active" | "coming_soon";

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  href?: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  recommended?: boolean;
}

export const AGENT_CATALOG: AgentDefinition[] = [
  {
    id: "script-review",
    name: "Script Review Agent",
    description:
      "Reviews JMeter scripts for quality, correlation, assertions, timers, and BlazeMeter readiness.",
    status: "active",
    href: "/agents/script-review",
    icon: FileSearch,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    recommended: true,
  },
  {
    id: "workload-modeling",
    name: "Workload Modeling Agent",
    description: "Converts NFRs and traffic patterns into user models and SLAs.",
    status: "coming_soon",
    icon: SlidersHorizontal,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    id: "correlation",
    name: "Correlation Agent",
    description: "Detects dynamic values and extractor recommendations.",
    status: "coming_soon",
    icon: GitBranch,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    id: "test-data",
    name: "Test Data Agent",
    description: "Validates and generates datasets and CSV inputs.",
    status: "coming_soon",
    icon: Database,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    id: "execution",
    name: "Execution Agent",
    description: "Orchestrates BlazeMeter test runs.",
    status: "coming_soon",
    icon: Play,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  {
    id: "results-analysis",
    name: "Results Analysis Agent",
    description: "Compares baselines and identifies regressions.",
    status: "coming_soon",
    icon: LineChart,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-600",
  },
  {
    id: "rca",
    name: "RCA Agent",
    description: "Correlates errors with infra and app signals.",
    status: "coming_soon",
    icon: Search,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    id: "executive-report",
    name: "Executive Report Agent",
    description: "Creates summary reports and release recommendations.",
    status: "coming_soon",
    icon: FileBarChart,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
];

export function getActiveAgentCount(): number {
  return AGENT_CATALOG.filter((a) => a.status === "active").length;
}

export function getTotalAgentCount(): number {
  return AGENT_CATALOG.length;
}
