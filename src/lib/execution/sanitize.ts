import path from "path";
import { getAllowedRoots } from "@/lib/project-setup/env";
import type { ProjectSetupConfig } from "@/lib/project-setup/types";

const PROJECT_NAME_RE = /^[a-zA-Z0-9-_]+$/;
const RESERVED_WINDOWS = new Set([
  "CON",
  "PRN",
  "AUX",
  "NUL",
  "COM1",
  "COM2",
  "COM3",
  "COM4",
  "LPT1",
  "LPT2",
  "LPT3",
]);

export function validateProjectName(name: string): void {
  if (!PROJECT_NAME_RE.test(name)) {
    throw new Error("Invalid project name. Use letters, numbers, hyphens, and underscores only.");
  }
  if (RESERVED_WINDOWS.has(name.toUpperCase())) {
    throw new Error("Project name is reserved on Windows.");
  }
}

export function resolveProjectRoot(locationPath: string, projectName: string): string {
  validateProjectName(projectName);
  const normalizedLocation = path.resolve(locationPath.trim());
  const root = path.resolve(normalizedLocation, projectName);
  assertUnderAllowedRoots(root);
  if (root.includes("..")) {
    throw new Error("Invalid project path.");
  }
  return root;
}

export function assertUnderAllowedRoots(resolvedPath: string): void {
  const roots = getAllowedRoots().map((r) => path.resolve(r));
  if (roots.length === 0) return;
  const ok = roots.some((root) => {
    const rel = path.relative(root, resolvedPath);
    return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
  });
  if (!ok) {
    throw new Error(
      `Path must be under allowed roots: ${roots.join(", ")}`
    );
  }
}

export function validateConfigPaths(config: ProjectSetupConfig): string {
  return resolveProjectRoot(config.locationPath, config.projectName);
}
