"use client";

import type { PlanResult } from "@/lib/project-setup/types";

export function ArchitecturePreviewCard({ plan }: { plan: PlanResult | null }) {
  if (!plan) {
    return (
      <div className="card h-fit p-5">
        <h3 className="font-semibold text-slate-900">Architecture preview</h3>
        <p className="mt-2 text-sm text-slate-500">Configure your stack to see the file tree.</p>
      </div>
    );
  }

  return (
    <div className="card h-fit p-5">
      <h3 className="font-semibold text-slate-900">Architecture preview</h3>
      <p className="mt-1 text-xs text-slate-500">
        Est. {plan.estimatedMinutes} min
      </p>
      <ul className="mt-3 max-h-48 overflow-y-auto font-mono text-xs text-slate-600">
        {plan.folderTree.map((line) => (
          <li key={line}>{line}/</li>
        ))}
      </ul>
      <ul className="mt-3 space-y-1 text-sm text-slate-600">
        {plan.checklist.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-brand-600">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProjectSummaryCard({
  config,
}: {
  config: import("@/lib/project-setup/types").ProjectSetupConfig;
}) {
  const items: string[] = [
    `Scope: ${config.projectScope.replace(/_/g, " ")}`,
    `Location: ${config.locationPath || "—"}`,
  ];
  if (config.projectScope !== "backend_only") {
    items.push(`Frontend: ${config.frontendFramework} + ${config.styling}`);
  }
  if (config.projectScope !== "frontend_only") {
    const frameworkLabel =
      config.backendFramework === "express" ? "Express.js" : config.backendFramework;
    items.push(`Backend: ${frameworkLabel} + ${config.database}`);
  }
  if (config.docker) items.push("Docker");
  if (config.githubActions) items.push("GitHub Actions");

  return (
    <div className="card h-fit p-5">
      <h3 className="font-semibold text-slate-900">Project summary</h3>
      <ul className="mt-3 space-y-1 text-sm text-slate-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
