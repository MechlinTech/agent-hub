"use client";

import { cn } from "@/lib/utils";
import type { ProjectScope } from "@/lib/project-setup/types";
import { Layers, Monitor, Server } from "lucide-react";

const SCOPES: {
  value: ProjectScope;
  label: string;
  description: string;
  icon: typeof Monitor;
}[] = [
  {
    value: "frontend_only",
    label: "Frontend Only",
    description: "UI app scaffold",
    icon: Monitor,
  },
  {
    value: "backend_only",
    label: "Backend Only",
    description: "API server scaffold",
    icon: Server,
  },
  {
    value: "full_stack",
    label: "Full Stack",
    description: "Frontend + backend",
    icon: Layers,
  },
];

export function ScopeSelector({
  value,
  onChange,
}: {
  value: ProjectScope;
  onChange: (scope: ProjectScope) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {SCOPES.map((scope) => {
        const Icon = scope.icon;
        const selected = value === scope.value;
        return (
          <button
            key={scope.value}
            type="button"
            onClick={() => onChange(scope.value)}
            className={cn(
              "card flex flex-col items-start gap-2 p-4 text-left transition",
              selected
                ? "border-brand-600 ring-2 ring-brand-600"
                : "hover:border-slate-300",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                selected ? "text-brand-600" : "text-slate-500",
              )}
            />
            <span className="font-semibold text-slate-900">{scope.label}</span>
            <span className="text-xs text-slate-500">{scope.description}</span>
          </button>
        );
      })}
    </div>
  );
}
