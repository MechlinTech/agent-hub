"use client";

import { AGENT_CATALOG } from "@/lib/agents/catalog";
import { AGENT_RESOURCE_MAP } from "@/lib/permissions";
import { usePermissions } from "@/lib/permissions-context";

export function AgentsPageSubtitle() {
  const { canRead } = usePermissions();
  const visible = AGENT_CATALOG.filter((agent) => {
    const resource = AGENT_RESOURCE_MAP[agent.id];
    if (!resource) return true;
    return canRead(resource);
  });
  const visibleActive = visible.filter((agent) => agent.status === "active").length;

  return (
    <>
      <div className="page-header hidden lg:block">
        <h1 className="page-title">Agents</h1>
        <p className="page-subtitle">
          {visibleActive} of {visible.length} agent{visible.length !== 1 ? "s" : ""} available to
          you in this workspace.
        </p>
      </div>

      <div className="mb-5 lg:hidden">
        <p className="text-sm font-medium text-slate-500">Catalog</p>
        <p className="mt-0.5 text-sm text-slate-600">
          {visibleActive} of {visible.length} agent{visible.length !== 1 ? "s" : ""} available to you
        </p>
      </div>
    </>
  );
}
