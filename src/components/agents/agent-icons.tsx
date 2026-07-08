"use client";

import type { LucideIcon } from "lucide-react";
import {
  Database,
  FileBarChart,
  FileSearch,
  FolderOpen,
  GitBranch,
  LineChart,
  Play,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { AgentIconKey } from "@/lib/agents/catalog";

const AGENT_ICON_MAP: Record<AgentIconKey, LucideIcon> = {
  "file-search": FileSearch,
  "sliders-horizontal": SlidersHorizontal,
  "git-branch": GitBranch,
  database: Database,
  play: Play,
  "line-chart": LineChart,
  search: Search,
  "file-bar-chart": FileBarChart,
  "folder-open": FolderOpen,
};

export function getAgentIcon(iconKey: AgentIconKey): LucideIcon {
  return AGENT_ICON_MAP[iconKey];
}
