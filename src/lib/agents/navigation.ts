import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bot,
  Cloud,
  FileBarChart,
  FileSearch,
  FolderOpen,
  History,
  LayoutDashboard,
  LineChart,
  Play,
  Plug,
  Plus,
  Settings,
  SlidersHorizontal,
  Upload,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive?: (pathname: string) => boolean;
}

export interface AgentNavConfig {
  id: string;
  basePath: string;
  name: string;
  /** Shorter label for compact secondary navigation. */
  shortName?: string;
  /** Routes outside basePath that belong to this agent (shown in agent sidebar). */
  scopedPaths: string[];
  items: NavItem[];
}

export const GLOBAL_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

const SCRIPT_REVIEW_BASE = "/agents/script-review";
const RESULTS_ANALYSIS_BASE = "/agents/results-analysis";
const PROJECT_SETUP_BASE = "/agents/project-setup";

export const AGENT_NAV: Record<string, AgentNavConfig> = {
  "script-review": {
    id: "script-review",
    basePath: SCRIPT_REVIEW_BASE,
    name: "Script Review Agent",
    shortName: "Script Review",
    scopedPaths: ["/test-assets", "/reports", "/executions"],
    items: [
      {
        href: SCRIPT_REVIEW_BASE,
        label: "Overview",
        icon: FileSearch,
        isActive: (pathname) =>
          pathname === SCRIPT_REVIEW_BASE ||
          (pathname.startsWith(`${SCRIPT_REVIEW_BASE}/`) &&
            !pathname.startsWith(`${SCRIPT_REVIEW_BASE}/new`) &&
            !pathname.startsWith(`${SCRIPT_REVIEW_BASE}/history`) &&
            !pathname.startsWith(`${SCRIPT_REVIEW_BASE}/configure`) &&
            !pathname.startsWith(`${SCRIPT_REVIEW_BASE}/test-assets`) &&
            !pathname.startsWith(`${SCRIPT_REVIEW_BASE}/reports`) &&
            !pathname.startsWith(`${SCRIPT_REVIEW_BASE}/executions`)),
      },
      {
        href: `${SCRIPT_REVIEW_BASE}/new`,
        label: "New Review",
        icon: Plus,
      },
      {
        href: `${SCRIPT_REVIEW_BASE}/history`,
        label: "History",
        icon: History,
      },
      {
        href: `${SCRIPT_REVIEW_BASE}/configure`,
        label: "Configure Rules",
        icon: SlidersHorizontal,
      },
      {
        href: `${SCRIPT_REVIEW_BASE}/test-assets`,
        label: "Test Assets",
        icon: FolderOpen,
      },
      {
        href: `${SCRIPT_REVIEW_BASE}/reports`,
        label: "Reports",
        icon: FileBarChart,
      },
      { href: `${SCRIPT_REVIEW_BASE}/executions`, label: "Executions", icon: Play },
    ],
  },
  "results-analysis": {
    id: "results-analysis",
    basePath: RESULTS_ANALYSIS_BASE,
    name: "BlazeMeter Results Analysis Agent",
    shortName: "Results Analysis",
    scopedPaths: [],
    items: [
      {
        href: RESULTS_ANALYSIS_BASE,
        label: "Overview",
        icon: LineChart,
        isActive: (pathname) =>
          pathname === RESULTS_ANALYSIS_BASE ||
          (pathname.startsWith(`${RESULTS_ANALYSIS_BASE}/`) &&
            !pathname.startsWith(`${RESULTS_ANALYSIS_BASE}/new`) &&
            !pathname.startsWith(`${RESULTS_ANALYSIS_BASE}/select-run`) &&
            !pathname.startsWith(`${RESULTS_ANALYSIS_BASE}/history`) &&
            !pathname.startsWith(`${RESULTS_ANALYSIS_BASE}/sla`) &&
            !pathname.startsWith(`${RESULTS_ANALYSIS_BASE}/library`) &&
            !pathname.includes("/blazemeter")),
      },
      {
        href: `${RESULTS_ANALYSIS_BASE}/new`,
        label: "New Analysis",
        icon: Upload,
      },
      {
        href: `${RESULTS_ANALYSIS_BASE}/select-run`,
        label: "Select Test Run",
        icon: Cloud,
      },
      {
        href: `${RESULTS_ANALYSIS_BASE}/history`,
        label: "History",
        icon: History,
      },
      {
        href: `${RESULTS_ANALYSIS_BASE}/library`,
        label: "Library",
        icon: BookOpen,
      },
      {
        href: `${RESULTS_ANALYSIS_BASE}/sla`,
        label: "Configure SLA",
        icon: SlidersHorizontal,
      },
    ],
  },
  "project-setup": {
    id: "project-setup",
    basePath: PROJECT_SETUP_BASE,
    name: "Project Setup Agent",
    shortName: "Project Setup",
    scopedPaths: [],
    items: [
      {
        href: PROJECT_SETUP_BASE,
        label: "Overview",
        icon: FolderOpen,
        isActive: (pathname) =>
          pathname === PROJECT_SETUP_BASE ||
          (pathname.startsWith(`${PROJECT_SETUP_BASE}/`) &&
            !pathname.startsWith(`${PROJECT_SETUP_BASE}/new`) &&
            !pathname.startsWith(`${PROJECT_SETUP_BASE}/history`)),
      },
      {
        href: `${PROJECT_SETUP_BASE}/new`,
        label: "New Setup",
        icon: Plus,
      },
      {
        href: `${PROJECT_SETUP_BASE}/history`,
        label: "History",
        icon: History,
      },
    ],
  },
};

function belongsToAgent(pathname: string, config: AgentNavConfig): boolean {
  if (pathname === config.basePath || pathname.startsWith(`${config.basePath}/`)) {
    return true;
  }
  return config.scopedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function getActiveAgentFromPath(pathname: string): AgentNavConfig | null {
  for (const config of Object.values(AGENT_NAV)) {
    if (belongsToAgent(pathname, config)) {
      return config;
    }
  }
  return null;
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.isActive) return item.isActive(pathname);
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function getResultsAnalysisIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/agents\/results-analysis\/([^/]+)(?:\/|$)/);
  if (!match) return null;
  const id = match[1];
  if (["new", "history", "sla", "select-run", "library"].includes(id)) return null;
  return id;
}

export function isGlobalNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/agents") {
    return pathname === "/agents" || (pathname.startsWith("/agents/") && !getActiveAgentFromPath(pathname));
  }
  if (href === "/settings") {
    return pathname === "/settings" || pathname.startsWith("/settings/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
