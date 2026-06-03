import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AgentCard } from "@/components/agents/AgentCard";
import { AGENT_CATALOG, getActiveAgentCount, getTotalAgentCount } from "@/lib/agents/catalog";

export default function AgentsPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Agents</h1>
        <p className="mt-1 text-slate-500">
          {getActiveAgentCount()} of {getTotalAgentCount()} agents deployed in this workspace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {AGENT_CATALOG.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
