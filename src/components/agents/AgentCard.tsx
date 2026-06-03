import Link from "next/link";
import { Star } from "lucide-react";
import type { AgentDefinition } from "@/lib/agents/catalog";
import { cn } from "@/lib/utils";

export function AgentCard({ agent }: { agent: AgentDefinition }) {
  const Icon = agent.icon;
  const isActive = agent.status === "active";

  return (
    <div
      className={cn(
        "card relative flex h-full flex-col p-5 transition-shadow hover:shadow-md",
        agent.recommended && isActive && "ring-2 ring-brand-500"
      )}
    >
      {agent.recommended && isActive && (
        <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-medium text-white">
          <Star className="h-3 w-3 fill-current" />
          Recommended Start
        </span>
      )}

      <div className="mb-3 flex items-start justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            agent.iconBg,
            agent.iconColor
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {isActive ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Active
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            Coming soon
          </span>
        )}
      </div>

      <h3 className="font-semibold text-slate-900">{agent.name}</h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">{agent.description}</p>

      {isActive && agent.href ? (
        <Link
          href={agent.href}
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Open Agent
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-4 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400"
        >
          Coming soon
        </button>
      )}
    </div>
  );
}
