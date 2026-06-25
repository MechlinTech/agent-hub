import fs from "fs/promises";
import path from "path";
import type { FileTemplate } from "@/lib/project-setup/types";
import { resolveProjectRoot } from "@/lib/execution/sanitize";
import type { ProjectSetupConfig } from "@/lib/project-setup/types";

export async function writeProjectFiles(
  config: ProjectSetupConfig,
  files: FileTemplate[]
): Promise<string[]> {
  const projectRoot = resolveProjectRoot(config.locationPath, config.projectName);
  const written: string[] = [];

  for (const file of files) {
    const fullPath = path.join(projectRoot, file.relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file.content, "utf8");
    written.push(fullPath);
  }

  return written;
}
