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
  const seen = new Set<string>();

  for (const file of files) {
    const fullPath = path.join(projectRoot, file.relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    const payload =
      file.encoding === "base64"
        ? Buffer.from(file.content, "base64")
        : file.content;
    await fs.writeFile(fullPath, payload, file.encoding === "base64" ? undefined : "utf8");
    if (!seen.has(fullPath)) {
      seen.add(fullPath);
      written.push(fullPath);
    }
  }

  return written;
}
