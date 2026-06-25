import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, "..", "server.ts");
const projectRoot = path.join(__dirname, "..", "..");

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tsx", serverPath],
  {
    cwd: projectRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env },
  }
);

child.on("exit", (code) => process.exit(code ?? 0));
