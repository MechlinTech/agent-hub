import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AgentExplorer } from "@/components/agents/AgentExplorer";
import { getActiveAgentCount, getTotalAgentCount } from "@/lib/agents/catalog";

export default function AgentsPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents" },
        ]}
      />

      <div className="page-header hidden lg:block">
        <h1 className="page-title">Agents</h1>
        <p className="page-subtitle">
          {getActiveAgentCount()} of {getTotalAgentCount()} agents deployed in this workspace.
        </p>
      </div>

      <div className="mb-5 lg:hidden">
        <p className="text-sm font-medium text-slate-500">Catalog</p>
        <p className="mt-0.5 text-sm text-slate-600">
          {getActiveAgentCount()} of {getTotalAgentCount()} agents ready to use
        </p>
      </div>

      <AgentExplorer />
    </div>
  );
}
