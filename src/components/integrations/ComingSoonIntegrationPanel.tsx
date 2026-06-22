import type { IntegrationDefinition } from "@/lib/integrations/catalog";

export function ComingSoonIntegrationPanel({
  integration,
}: {
  integration: IntegrationDefinition;
}) {
  return (
    <div className="card p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-900">{integration.name}</h2>
      <p className="mt-2 text-sm text-slate-500">{integration.description}</p>
      <span className="mt-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
        Coming soon
      </span>
    </div>
  );
}
