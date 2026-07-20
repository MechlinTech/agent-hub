"use client";

import { FileSearch, FolderOpen, LineChart } from "lucide-react";
import { useState } from "react";
import { LANDING_AGENTS } from "../content/agents";

const AGENT_IDS = [
  "project-setup",
  "script-review",
  "results-analysis",
] as const;
type AgentId = (typeof AGENT_IDS)[number];

const AGENT_ICONS = {
  "script-review": FileSearch,
  "results-analysis": LineChart,
  "project-setup": FolderOpen,
} as const;

const TAB_LABELS: Record<AgentId, string> = {
  "project-setup": "Dev Scaffold",
  "script-review": "Script review",
  "results-analysis": "Results analysis",
};

const CARD_TRANSITION =
  "transform 0.48s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), top 0.48s cubic-bezier(0.4, 0, 0.2, 1)";

const DEPTH_STYLES = [
  { top: 0, x: 0, y: 0, rotate: -1.5, z: 30, scale: 1, opacity: 1 },
  { top: 20, x: 14, y: 22, rotate: 0.75, z: 20, scale: 0.965, opacity: 0.9 },
  { top: 40, x: 28, y: 44, rotate: -0.75, z: 10, scale: 0.93, opacity: 0.8 },
] as const;

function stackDepth(agentId: AgentId, activeId: AgentId): number {
  const start = AGENT_IDS.indexOf(activeId);
  const rotated = [...AGENT_IDS.slice(start), ...AGENT_IDS.slice(0, start)];
  return rotated.indexOf(agentId);
}

function AgentPreviewCard({
  agent,
  id,
  isFront,
}: {
  agent: (typeof LANDING_AGENTS)[number];
  id: AgentId;
  isFront: boolean;
}) {
  const Icon = AGENT_ICONS[id];
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white ring-1 ring-indigo-950/10 transition-[box-shadow,border-color] duration-300 ease-out ${
        isFront
          ? "border-white/90 shadow-float ring-brand-600/15"
          : "border-white/70 shadow-card"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-indigo-950/5 bg-indigo-50/80 px-3 py-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600/10 text-brand-600">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="truncate text-xs font-semibold text-indigo-950">
          {agent.name}
        </span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={agent.media.hero}
        alt=""
        className="block h-auto w-full"
        loading="eager"
      />
    </div>
  );
}

export function HeroVisual() {
  const [activeId, setActiveId] = useState<AgentId>("project-setup");
  const activeAgent =
    LANDING_AGENTS.find((a) => a.id === activeId) ?? LANDING_AGENTS[0];

  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div
        className="pointer-events-none absolute -right-8 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-brand-400/25 blur-3xl"
        aria-hidden
      />

      {/* Reserve vertical space so stacked cards never cover the tab row */}
      <div className="relative hidden sm:block">
        <div
          className="invisible mx-auto w-[92%] max-w-md select-none"
          aria-hidden
        >
          <AgentPreviewCard agent={activeAgent} id={activeId} isFront />
          <div className="h-28 lg:h-24" />
        </div>

        <div className="absolute inset-x-0 top-0">
          {AGENT_IDS.map((id) => {
            const agent = LANDING_AGENTS.find((a) => a.id === id);
            if (!agent) return null;
            const depth = stackDepth(id, activeId);
            const s = DEPTH_STYLES[depth] ?? DEPTH_STYLES[2];
            const isFront = depth === 0;

            return (
              <div
                key={id}
                className={`absolute left-0 right-0 mx-auto w-[92%] max-w-md ${
                  isFront ? "pointer-events-auto" : "pointer-events-none"
                }`}
                style={{
                  top: s.top,
                  zIndex: s.z,
                  opacity: s.opacity,
                  transform: `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rotate}deg) scale(${s.scale})`,
                  transition: CARD_TRANSITION,
                }}
              >
                <AgentPreviewCard agent={agent} id={id} isFront={isFront} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:hidden">
        {AGENT_IDS.map((id) => {
          const agent = LANDING_AGENTS.find((a) => a.id === id);
          if (!agent) return null;
          const Icon = AGENT_ICONS[id];
          const selected = id === activeId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveId(id)}
              className={`overflow-hidden rounded-xl border text-left transition-all duration-300 ease-out ${
                selected
                  ? "border-brand-500 ring-2 ring-brand-600/25 shadow-card"
                  : "border-white/80 opacity-80 ring-1 ring-indigo-950/5"
              }`}
            >
              <div className="flex items-center justify-center gap-1 bg-indigo-50/80 px-1 py-1.5">
                <Icon className="h-3 w-3 text-brand-600" />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={agent.media.hero}
                alt=""
                className="block h-16 w-full object-cover object-top"
              />
            </button>
          );
        })}
      </div>

      <div
        className="relative z-50 mt-4 grid w-full grid-cols-3 gap-0.5 rounded-2xl bg-white/70 p-0.5 shadow-sm ring-1 ring-indigo-950/5 backdrop-blur-sm sm:mt-5"
        role="tablist"
        aria-label="Preview agents"
      >
        {AGENT_IDS.map((id) => {
          const selected = id === activeId;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveId(id)}
              className={`min-w-0 rounded-2xl px-1 py-2 text-center text-[11px] font-medium leading-tight transition-colors duration-300 ease-out sm:text-xs ${
                selected
                  ? "brand-gradient text-white shadow-sm"
                  : "text-indigo-900/70 hover:bg-white/90 hover:text-indigo-950"
              }`}
            >
              <span className="block truncate">{TAB_LABELS[id]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
