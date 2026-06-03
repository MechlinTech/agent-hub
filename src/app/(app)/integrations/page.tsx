import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function IntegrationsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Home", href: "/dashboard" }, { label: "Integrations" }]} />
      <h1 className="text-2xl font-bold">Integrations</h1>
      <p className="mt-2 text-slate-500">
        External integrations are not connected in this workspace.
      </p>
      <div className="card mt-6 divide-y">
        {[
          { name: "BlazeMeter", status: "Not connected" },
          { name: "Jira", status: "Not connected" },
          { name: "Confluence", status: "Not connected" },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between px-4 py-4">
            <span className="font-medium">{item.name}</span>
            <span className="text-sm text-slate-500">{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
