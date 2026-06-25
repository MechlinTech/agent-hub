import path from "path";
import type { ProjectSetupConfig, PlanResult } from "@/lib/project-setup/types";
import { ensureTemplatesRegistered } from "@/lib/project-setup/templates/index";
import { getApplicableModules } from "@/lib/project-setup/templates/registry";
import {
  envExampleContent,
  readmeContent,
  scopeIncludesBackend,
  scopeIncludesFrontend,
} from "@/lib/project-setup/templates/shared";
import { resolveProjectRoot } from "@/lib/execution/sanitize";

export function buildPlan(config: ProjectSetupConfig): PlanResult {
  ensureTemplatesRegistered();
  const projectRoot = resolveProjectRoot(config.locationPath, config.projectName);
  const modules = getApplicableModules(config);

  const files = [
    { relativePath: "README.md", content: readmeContent(config) },
    { relativePath: ".env.example", content: envExampleContent(config) },
    ...modules.flatMap((m) => m.files(config, projectRoot)),
  ];

  const commands = modules.flatMap((m) => m.commands(config, projectRoot));

  const folderTree = buildFolderTree(config, files.map((f) => f.relativePath));
  const checklist = modules.flatMap((m) => m.checklist(config));
  const dependencies = Array.from(new Set(modules.flatMap((m) => m.dependencies(config))));

  return {
    folderTree,
    files,
    commands,
    checklist,
    dependencies,
    estimatedMinutes: Math.max(5, Math.min(15, 3 + commands.length)),
  };
}

function buildFolderTree(config: ProjectSetupConfig, filePaths: string[]): string[] {
  const dirs = new Set<string>();
  dirs.add(config.projectName);
  if (scopeIncludesFrontend(config) && config.projectScope === "full_stack") {
    dirs.add(`${config.projectName}/frontend`);
  }
  if (scopeIncludesBackend(config) && config.projectScope === "full_stack") {
    dirs.add(`${config.projectName}/backend`);
  }
  for (const fp of filePaths) {
    const parts = fp.split("/");
    let acc = config.projectName;
    for (let i = 0; i < parts.length - 1; i++) {
      acc = path.posix.join(acc, parts[i]!);
      dirs.add(acc);
    }
  }
  return Array.from(dirs).sort();
}
