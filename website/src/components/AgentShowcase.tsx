"use client";

import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  FolderOpen,
  LineChart,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import type { LandingAgent } from "../content/agents";
import { AgentMedia } from "./AgentMedia";

const ICONS = {
  "script-review": FileSearch,
  "results-analysis": LineChart,
  "project-setup": FolderOpen,
} as const;

const ACCENT = {
  "script-review": "from-violet-600/20 via-fuchsia-500/10 to-transparent",
  "results-analysis": "from-indigo-600/20 via-blue-500/10 to-transparent",
  "project-setup": "from-purple-600/20 via-pink-500/10 to-transparent",
} as const;

const STEP_LABELS = ["Build", "Review", "Analyze"];

type AgentShowcaseProps = {
  agents: LandingAgent[];
};

export function AgentShowcase({ agents }: AgentShowcaseProps) {
  const [activeId, setActiveId] = useState(agents[0]?.id ?? "script-review");
  const activeAgent = agents.find((a) => a.id === activeId) ?? agents[0];
  const activeIndex = agents.findIndex((a) => a.id === activeId);

  if (!activeAgent) return null;

  const Icon = ICONS[activeAgent.id as keyof typeof ICONS] ?? FileSearch;

  return (
    <section id="agents" className="scroll-mt-24 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-600/10 px-3 py-1 text-xs font-semibold text-brand-700">
              <Sparkles className="h-3.5 w-3.5" />
              Live agent catalog
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-indigo-950 sm:text-4xl">
              Three agents, one release pipeline
            </h2>
            <p className="mt-4 text-lg text-indigo-900/70">
              From script hardening to post-run insights and local
              scaffolding-pick an agent to explore features and see it in
              action.
            </p>
          </div>
          <div className="hidden items-center gap-2 text-sm font-medium text-indigo-800/60 lg:flex">
            {STEP_LABELS.map((label, i) => (
              <span key={label} className="flex items-center gap-2">
                {/* {i > 0 && <ArrowRight className="h-4 w-4 text-brand-400" />} */}
                {i > 0 && <span className="text-brand-400">|</span>}
                <span className={i === activeIndex ? "text-brand-600" : ""}>
                  {label}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {agents.map((agent, index) => {
            const TabIcon = ICONS[agent.id as keyof typeof ICONS] ?? FileSearch;
            const selected = agent.id === activeId;
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => setActiveId(agent.id)}
                className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
                  selected
                    ? "border-brand-400/50 bg-white shadow-card ring-2 ring-brand-600/25"
                    : "border-white/60 bg-white/50 hover:border-brand-200 hover:bg-white/80"
                }`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80 ${
                    ACCENT[agent.id as keyof typeof ACCENT] ??
                    ACCENT["script-review"]
                  }`}
                />
                <div className="relative flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      selected
                        ? "brand-gradient text-white"
                        : "bg-violet-50 text-brand-600"
                    }`}
                  >
                    <TabIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wide text-brand-600/80">
                      {STEP_LABELS[index] ?? `Agent ${index + 1}`}
                    </span>
                    <p className="mt-0.5 font-semibold text-indigo-950">
                      {agent.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-indigo-900/65">
                      {agent.tagline}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <article className="relative overflow-hidden rounded-4xl border border-white/70 bg-white/70 p-6 shadow-card ring-1 ring-indigo-950/5 sm:p-10">
          <div
            className={`pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-gradient-to-br opacity-70 ${
              ACCENT[activeAgent.id as keyof typeof ACCENT] ??
              ACCENT["script-review"]
            }`}
            aria-hidden
          />
          <div className="relative grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <div className="mb-4 inline-flex items-center gap-3">
                <span className="brand-gradient flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-float">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-2xl font-bold text-indigo-950">
                    {activeAgent.name}
                  </h3>
                  <p className="text-sm font-medium text-brand-600">
                    {activeAgent.tagline}
                  </p>
                </div>
              </div>
              <p className="text-base leading-relaxed text-indigo-900/75">
                {activeAgent.description}
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-1">
                {activeAgent.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex gap-3 rounded-xl bg-white/70 px-3 py-2 text-sm text-indigo-900/85 ring-1 ring-indigo-950/5"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-7">
              <AgentMedia
                media={activeAgent.media}
                agentName={activeAgent.name}
              />
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
