import path from "path";
import type { ProjectSetupConfig, PlanResult, FileTemplate } from "@/lib/project-setup/types";
import { ensureTemplatesRegistered } from "@/lib/project-setup/templates/index";
import { getApplicableModules } from "@/lib/project-setup/templates/registry";
import {
  backendEnvExampleContent,
  envExampleContent,
  envFileContent,
  backendEnvRel,
  frontendEnvExampleContent,
  frontendEnvFileContent,
  frontendEnvRel,
  hasBackendEnvValues,
  hasFrontendEnvValues,
  readmeContent,
  scopeIncludesBackend,
  scopeIncludesFrontend,
  usesFrontendAuth,
} from "@/lib/project-setup/templates/shared";
import { resolveProjectRoot } from "@/lib/execution/sanitize";

export function buildPlan(config: ProjectSetupConfig): PlanResult {
  ensureTemplatesRegistered();
  const projectRoot = resolveProjectRoot(config.locationPath, config.projectName);
  const modules = getApplicableModules(config);

  const envFiles: FileTemplate[] = [
    { relativePath: "README.md", content: readmeContent(config) },
    { relativePath: ".env.example", content: envExampleContent(config) },
  ];

  if (scopeIncludesBackend(config)) {
    envFiles.push({
      relativePath: `${backendEnvRel(config).replace(/\.env$/, ".env.example")}`,
      content: backendEnvExampleContent(config),
    });
    if (hasBackendEnvValues(config)) {
      envFiles.push({ relativePath: backendEnvRel(config), content: envFileContent(config) });
    }
  }

  if (scopeIncludesFrontend(config) && usesFrontendAuth(config)) {
    const feExample = frontendEnvExampleContent(config);
    if (feExample) {
      envFiles.push({
        relativePath: `${frontendEnvRel(config).replace(/\.env$/, ".env.example")}`,
        content: feExample,
      });
      if (hasFrontendEnvValues(config)) {
        envFiles.push({
          relativePath: frontendEnvRel(config),
          content: frontendEnvFileContent(config),
        });
      }
    }
  }

  const files = dedupeFilesByPath([
    ...envFiles,
    ...modules.flatMap((m) => m.files(config, projectRoot)),
  ]);

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

/** Keep the last template when multiple modules emit the same relative path. */
function dedupeFilesByPath(files: FileTemplate[]): FileTemplate[] {
  const byPath = new Map<string, FileTemplate>();
  for (const file of files) {
    byPath.set(file.relativePath, file);
  }
  return Array.from(byPath.values());
}
