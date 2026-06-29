"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { getAgentIcon } from "@/components/agents/agent-icons";
import type { AgentDefinition } from "@/lib/agents/catalog";
import { cn } from "@/lib/utils";

function AgentCardContent({ agent }: { agent: AgentDefinition }) {
  const Icon = getAgentIcon(agent.iconKey);
  const isActive = agent.status === "active";

  return (
    <>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-105",
            agent.iconBg,
            agent.iconColor
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {isActive ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
            Soon
          </span>
        )}
      </div>

      <h3 className="font-bold tracking-tight text-slate-900">{agent.name}</h3>
      <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
        {agent.description}
      </p>

      <div className="mt-3 min-h-[1.75rem]">
        {agent.recommended && isActive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
            <Star className="h-3 w-3 fill-brand-600 text-brand-600" />
            Recommended start
          </span>
        )}
      </div>
    </>
  );
}

export function AgentCard({ agent }: { agent: AgentDefinition }) {
  const isActive = agent.status === "active";
  const cardClass = cn(
    "mobile-card group flex h-full flex-col rounded-3xl p-4 transition-all duration-300 sm:p-5 lg:card lg:hover:-translate-y-0.5 lg:hover:shadow-card-hover",
    agent.recommended && isActive && "ring-2 ring-brand-500/20",
    isActive && agent.href && "active:scale-[0.99]"
  );

  if (isActive && agent.href) {
    return (
      <Link href={agent.href} className={cardClass}>
        <div className="flex flex-1 flex-col">
          <AgentCardContent agent={agent} />
        </div>
        <span className="btn-primary mt-4 inline-flex w-full shrink-0">Open Agent</span>
      </Link>
    );
  }

  return (
    <div className={cardClass}>
      <div className="flex flex-1 flex-col">
        <AgentCardContent agent={agent} />
      </div>
      <button
        type="button"
        disabled
        className="mt-4 w-full shrink-0 cursor-not-allowed rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400"
      >
        Coming soon
      </button>
    </div>
  );
}
