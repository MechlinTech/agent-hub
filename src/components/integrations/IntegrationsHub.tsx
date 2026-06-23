"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { BlazeMeterIntegrationPanel } from "@/components/integrations/BlazeMeterIntegrationPanel";
import { ComingSoonIntegrationPanel } from "@/components/integrations/ComingSoonIntegrationPanel";
import { usePermissions } from "@/lib/permissions-context";
import {
  INTEGRATION_CATALOG,
  type IntegrationDefinition,
} from "@/lib/integrations/catalog";
import { cn } from "@/lib/utils";

export function IntegrationsHub() {
  const [selectedId, setSelectedId] = useState("blazemeter");
  const [blazemeterConnected, setBlazemeterConnected] = useState(false);
  const { canWrite } = usePermissions();
  const canEdit = canWrite("integrations");

  useEffect(() => {
    fetch("/api/integrations/blazemeter")
      .then((r) => r.json())
      .then((data) => setBlazemeterConnected(Boolean(data.connected)))
      .catch(() => setBlazemeterConnected(false));
  }, [selectedId]);

  const selected =
    INTEGRATION_CATALOG.find((i) => i.id === selectedId) ?? INTEGRATION_CATALOG[0];

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Select integration
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="input w-full max-w-md"
        >
          {INTEGRATION_CATALOG.map((integration) => (
            <option key={integration.id} value={integration.id}>
              {integration.name}
              {integration.status === "coming_soon" ? " (Coming soon)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Available integrations
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {INTEGRATION_CATALOG.map((integration) => (
            <IntegrationSummaryCard
              key={integration.id}
              integration={integration}
              selected={integration.id === selectedId}
              connected={integration.id === "blazemeter" && blazemeterConnected}
              onSelect={() => setSelectedId(integration.id)}
            />
          ))}
        </div>
      </div>

      <div>
        {selected.id === "blazemeter" ? (
          <BlazeMeterIntegrationPanel
            readOnly={!canEdit}
            onStatusChange={(connected) => setBlazemeterConnected(connected)}
          />
        ) : (
          <ComingSoonIntegrationPanel integration={selected} />
        )}
      </div>
    </div>
  );
}

function IntegrationSummaryCard({
  integration,
  selected,
  connected,
  onSelect,
}: {
  integration: IntegrationDefinition;
  selected: boolean;
  connected: boolean;
  onSelect: () => void;
}) {
  const isActive = integration.status === "active";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "card w-full p-4 text-left transition-shadow hover:shadow-md",
        selected && "ring-2 ring-brand-500"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="font-semibold text-slate-900">{integration.name}</span>
        {isActive && connected ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
            <CheckCircle2 className="h-3 w-3" />
            Connected
          </span>
        ) : isActive ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            Setup
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            <Clock className="h-3 w-3" />
            Soon
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500">{integration.category}</p>
      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{integration.description}</p>
    </button>
  );
}
