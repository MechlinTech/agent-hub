import {
  getActiveAgentFromPath,
  getResultsAnalysisIdFromPath,
  GLOBAL_NAV,
  isNavItemActive,
} from "@/lib/agents/navigation";

export const MOBILE_TAB_NAV = GLOBAL_NAV;

export function getMobilePageTitle(pathname: string): string {
  if (pathname.includes("/blazemeter")) return "BlazeMeter Results";

  const scriptDetail = pathname.match(
    /^\/agents\/script-review\/([^/]+)(?:\/([^/]+))?/
  );
  if (scriptDetail) {
    const segment = scriptDetail[1];
    if (segment === "new") return "New Review";
    if (segment === "history") return "History";
    if (segment === "configure") return "Configure Rules";
    const sub = scriptDetail[2];
    if (sub === "results") return "Results";
    if (sub === "report") return "Report";
    if (sub === "analyzing") return "Analyzing";
    if (sub === "findings") return "Finding";
    if (segment && !["new", "history", "configure"].includes(segment)) {
      return "Script Review";
    }
  }

  const activeAgent = getActiveAgentFromPath(pathname);
  if (activeAgent) {
    for (const item of activeAgent.items) {
      if (isNavItemActive(pathname, item)) return item.label;
    }
    return activeAgent.name;
  }

  for (const item of GLOBAL_NAV) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (item.href === "/settings" && pathname !== "/settings") {
        const segment = pathname.split("/")[2];
        if (segment === "users") return "Users";
        if (segment === "roles") return "Role permissions";
      }
      return item.label;
    }
  }

  return "Agent Hub";
}

export function isMobileRootTab(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname === "/agents" ||
    pathname === "/integrations" ||
    pathname === "/settings" ||
    pathname === "/settings/users" ||
    pathname === "/settings/roles"
  );
}

export function getMobileBackHref(pathname: string): string | null {
  if (
    pathname === "/dashboard" ||
    pathname === "/agents" ||
    pathname === "/integrations" ||
    pathname === "/settings" ||
    pathname === "/settings/users" ||
    pathname === "/settings/roles"
  ) {
    return null;
  }

  if (pathname.startsWith("/settings/")) {
    return "/settings";
  }

  const activeAgent = getActiveAgentFromPath(pathname);
  if (!activeAgent) {
    if (pathname.startsWith("/agents")) return "/agents";
    return null;
  }

  const resultsAnalysisId = getResultsAnalysisIdFromPath(pathname);
  if (resultsAnalysisId) {
    const detailBase = `/agents/results-analysis/${resultsAnalysisId}`;
    if (pathname === detailBase) return activeAgent.basePath;
    if (pathname.startsWith(`${detailBase}/`)) return detailBase;
  }

  const scriptMatch = pathname.match(/^\/agents\/script-review\/([^/]+)(\/.*)?$/);
  if (scriptMatch && !["new", "history", "configure"].includes(scriptMatch[1])) {
    const detailBase = `/agents/script-review/${scriptMatch[1]}`;
    if (pathname === detailBase || pathname.endsWith("/analyzing")) {
      return activeAgent.basePath;
    }
    if (pathname.startsWith(`${detailBase}/`)) return detailBase;
  }

  for (const item of activeAgent.items) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (pathname === activeAgent.basePath) return "/agents";
      return activeAgent.basePath;
    }
  }

  if (
    activeAgent.scopedPaths.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    )
  ) {
    return activeAgent.basePath;
  }

  if (pathname === activeAgent.basePath) return "/agents";
  return activeAgent.basePath;
}
