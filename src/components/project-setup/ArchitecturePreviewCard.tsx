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
  compact = false,
}: {
  config: import("@/lib/project-setup/types").ProjectSetupConfig;
  compact?: boolean;
}) {
  const rows: { label: string; value: string }[] = [
    { label: "Scope", value: config.projectScope.replace(/_/g, " ") },
    { label: "Location", value: config.locationPath || "—" },
  ];

  if (config.projectScope !== "backend_only") {
    rows.push({
      label: "Frontend",
      value: `${config.frontendFramework} + ${config.styling}`,
    });
  }

  if (config.projectScope !== "frontend_only") {
    const frameworkLabel =
      config.backendFramework === "express"
        ? "Express.js"
        : config.backendFramework === "nestjs"
          ? "NestJS"
          : config.backendFramework;
    rows.push({
      label: "Backend",
      value: `${frameworkLabel} + ${config.database}`,
    });
  }

  const extras: string[] = [];
  if (config.swagger) extras.push("Swagger");
  if (config.docker) extras.push("Docker");
  if (config.githubActions) extras.push("GitHub Actions");
  if (config.redis) extras.push("Redis");
  if (config.socketIo) extras.push("Socket.IO");

  return (
    <div className="card h-fit p-5">
      <h3 className="font-semibold text-slate-900">Project summary</h3>
      {!compact ? (
        <p className="mt-1 text-xs text-slate-500">
          Live preview of your current configuration.
        </p>
      ) : null}
      <dl className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {row.label}
            </dt>
            <dd className="text-sm font-medium capitalize text-slate-800">{row.value}</dd>
          </div>
        ))}
      </dl>
      {extras.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {extras.map((item) => (
            <span
              key={item}
              className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
