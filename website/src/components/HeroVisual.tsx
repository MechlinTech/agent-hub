"use client";

import { FileSearch, FolderOpen, LineChart } from "lucide-react";
import { useState } from "react";
import { LANDING_AGENTS } from "../content/agents";
import type { LandingAgent } from "../content/agents";

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
  { top: 0, x: 0, y: 0, rotate: 0, z: 30, scale: 1, opacity: 1 },
  { top: 20, x: 14, y: 22, rotate: 0.75, z: 20, scale: 0.97, opacity: 0.88 },
  { top: 40, x: 28, y: 44, rotate: -0.75, z: 10, scale: 0.94, opacity: 0.76 },
] as const;

/** Feature screenshots read better in the small hero cards than full-page hero captures. */
function heroCardImage(agent: LandingAgent): string {
  return agent.media.screenshots[0]?.src ?? agent.media.hero;
}

function stackDepth(agentId: AgentId, activeId: AgentId): number {
  const start = AGENT_IDS.indexOf(activeId);
  const rotated = [...AGENT_IDS.slice(start), ...AGENT_IDS.slice(0, start)];
  return rotated.indexOf(agentId);
}

function cardTransform(depthStyle: (typeof DEPTH_STYLES)[number], isFront: boolean): string {
  if (isFront) {
    return "translate3d(0, 0, 0)";
  }
  const { x, y, rotate, scale } = depthStyle;
  return `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`;
}

function AgentPreviewCard({
  agent,
  id,
  isFront,
}: {
  agent: LandingAgent;
  id: AgentId;
  isFront: boolean;
}) {
  const Icon = AGENT_ICONS[id];
  const src = heroCardImage(agent);

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
      <div className="bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${agent.name} preview`}
          className="block h-auto w-full"
          loading={isFront ? "eager" : "lazy"}
          decoding="sync"
          fetchPriority={isFront ? "high" : "auto"}
          draggable={false}
        />
      </div>
    </div>
  );
}

export function HeroVisual() {
  const [activeId, setActiveId] = useState<AgentId>("project-setup");
  const activeAgent =
    LANDING_AGENTS.find((a) => a.id === activeId) ?? LANDING_AGENTS[0];

  return (
    <div className="relative isolate mx-auto w-full max-w-lg lg:max-w-none">
      <div
        className="pointer-events-none absolute -right-8 top-1/2 -z-10 h-72 w-72 -translate-y-1/2 rounded-full bg-brand-400/20 blur-3xl"
        aria-hidden
      />

      <div className="relative hidden sm:block">
        <div
          className="invisible mx-auto w-full max-w-xl select-none lg:max-w-2xl"
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
                className={`absolute left-0 right-0 mx-auto w-full max-w-xl lg:max-w-2xl ${
                  isFront ? "pointer-events-auto z-30" : "pointer-events-none"
                }`}
                style={{
                  top: s.top,
                  zIndex: s.z,
                  opacity: s.opacity,
                  transform: cardTransform(s, isFront),
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
              className={`overflow-hidden rounded-xl border bg-white text-left transition-all duration-300 ease-out ${
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
                src={heroCardImage(agent)}
                alt=""
                className="block h-24 w-full object-contain object-top p-0.5"
                loading="lazy"
                decoding="sync"
                draggable={false}
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
