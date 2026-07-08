import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AgentExplorer } from "@/components/agents/AgentExplorer";
import { AgentsPageSubtitle } from "@/components/agents/AgentsPageSubtitle";

export default function AgentsPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents" },
        ]}
      />

      <AgentsPageSubtitle />

      <AgentExplorer />
    </div>
  );
}
