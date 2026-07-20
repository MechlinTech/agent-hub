import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "website", "public");
const dest = join(root, "public");

if (!existsSync(src)) {
  console.warn("website/public not found, skipping sync");
  process.exit(0);
}

const mediaDest = join(dest, "media");
if (existsSync(mediaDest)) {
  rmSync(mediaDest, { recursive: true, force: true });
}

cpSync(src, dest, { recursive: true, force: true });
console.log("Synced website/public → public/");
