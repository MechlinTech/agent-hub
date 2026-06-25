export type AgentStatus = "active" | "coming_soon";

export type AgentIconKey =
  | "file-search"
  | "sliders-horizontal"
  | "git-branch"
  | "database"
  | "play"
  | "line-chart"
  | "search"
  | "file-bar-chart"
  | "folder-open";

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  href?: string;
  iconKey: AgentIconKey;
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
    iconKey: "file-search",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    recommended: true,
  },
  {
    id: "results-analysis",
    name: "BlazeMeter Results Analysis Agent",
    description:
      "Analyze BlazeMeter results, validate SLAs, detect bottlenecks, and generate executive summaries.",
    status: "active",
    href: "/agents/results-analysis",
    iconKey: "line-chart",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  {
    id: "project-setup",
    name: "Project Setup Agent",
    description:
      "Configure a project stack and scaffold frontend, backend, DevOps files on your machine via the Local Executor.",
    status: "active",
    href: "/agents/project-setup",
    iconKey: "folder-open",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    recommended: true,
  },
  {
    id: "workload-modeling",
    name: "Workload Modeling Agent",
    description: "Converts NFRs and traffic patterns into user models and SLAs.",
    status: "coming_soon",
    iconKey: "sliders-horizontal",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    id: "correlation",
    name: "Correlation Agent",
    description: "Detects dynamic values and extractor recommendations.",
    status: "coming_soon",
    iconKey: "git-branch",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    id: "test-data",
    name: "Test Data Agent",
    description: "Validates and generates datasets and CSV inputs.",
    status: "coming_soon",
    iconKey: "database",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    id: "execution",
    name: "Execution Agent",
    description: "Orchestrates BlazeMeter test runs.",
    status: "coming_soon",
    iconKey: "play",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  {
    id: "rca",
    name: "RCA Agent",
    description: "Correlates errors with infra and app signals.",
    status: "coming_soon",
    iconKey: "search",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    id: "executive-report",
    name: "Executive Report Agent",
    description: "Creates summary reports and release recommendations.",
    status: "coming_soon",
    iconKey: "file-bar-chart",
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

export function getComingSoonAgentCount(): number {
  return AGENT_CATALOG.filter((a) => a.status === "coming_soon").length;
}
