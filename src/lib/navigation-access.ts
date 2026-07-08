import type { NavItem } from "@/lib/agents/navigation";
import { GLOBAL_NAV } from "@/lib/agents/navigation";
import type { Resource } from "@/lib/permissions";

export const GLOBAL_NAV_ACCESS: Partial<Record<string, Resource>> = {
  "/integrations": "integrations",
  "/settings": "settings",
};

export interface NavAccessRule {
  resource: Resource;
  requireWrite?: boolean;
}

export const AGENT_NAV_ITEM_ACCESS: Partial<Record<string, NavAccessRule>> = {
  "/agents/script-review/new": { resource: "script_review", requireWrite: true },
  "/agents/script-review/configure": { resource: "script_review", requireWrite: true },
  "/agents/results-analysis/new": { resource: "results_analysis", requireWrite: true },
  "/agents/results-analysis/select-run": { resource: "results_analysis" },
  "/agents/results-analysis/sla": { resource: "results_analysis", requireWrite: true },
  "/agents/project-setup/new": { resource: "project_setup", requireWrite: true },
};

export function canAccessNavHref(
  href: string,
  canRead: (resource: Resource) => boolean,
  canWrite: (resource: Resource) => boolean
): boolean {
  const agentAccess = AGENT_NAV_ITEM_ACCESS[href];
  if (agentAccess) {
    return agentAccess.requireWrite
      ? canWrite(agentAccess.resource)
      : canRead(agentAccess.resource);
  }

  const globalResource = GLOBAL_NAV_ACCESS[href];
  if (globalResource) return canRead(globalResource);

  return true;
}

export function filterNavItemsByAccess(
  items: NavItem[],
  canRead: (resource: Resource) => boolean,
  canWrite: (resource: Resource) => boolean
): NavItem[] {
  return items.filter((item) => canAccessNavHref(item.href, canRead, canWrite));
}

export function filterGlobalNavByAccess(
  canRead: (resource: Resource) => boolean,
  canWrite: (resource: Resource) => boolean
) {
  return GLOBAL_NAV.filter((item) => canAccessNavHref(item.href, canRead, canWrite));
}
