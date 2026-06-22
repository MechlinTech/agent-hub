import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { IntegrationsHub } from "@/components/integrations/IntegrationsHub";

export default function IntegrationsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Home", href: "/dashboard" }, { label: "Integrations" }]} />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
        <p className="mt-1 text-slate-500">
          Connect external platforms used across all agents in this workspace.
        </p>
      </div>

      <IntegrationsHub />
    </div>
  );
}
