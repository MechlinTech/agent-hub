import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { assertUnderAllowedRoots } from "../../src/lib/execution/sanitize";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function runCommand(
  exe: string,
  args: string[],
  options: { windowsHide?: boolean } = {}
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, {
      windowsHide: options.windowsHide ?? true,
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ stdout, stderr, code }));
  });
}

async function pickWindowsFolder(): Promise<string | null> {
  const scriptPath = path.join(__dirname, "scripts", "pick-folder-windows.ps1");
  const { stdout, code } = await runCommand(
    "powershell.exe",
    ["-NoProfile", "-STA", "-ExecutionPolicy", "Bypass", "-File", scriptPath],
    { windowsHide: false }
  );

  const picked = stdout.trim();
  if (code === 0 && picked) return picked;
  if (code === 1 && !picked) return null;
  throw new Error("Folder picker failed");
}

async function pickMacFolder(): Promise<string | null> {
  const { stdout, code } = await runCommand("osascript", [
    "-e",
    'POSIX path of (choose folder with prompt "Select project location")',
  ]);
  const picked = stdout.trim();
  if (code === 0 && picked) return picked.replace(/\/$/, "");
  if (code === 1) return null;
  throw new Error("Folder picker failed");
}

async function pickLinuxFolder(): Promise<string | null> {
  try {
    const { stdout, code } = await runCommand("zenity", [
      "--file-selection",
      "--directory",
      "--title=Select project location",
    ]);
    const picked = stdout.trim();
    if (code === 0 && picked) return picked;
    if (code === 1) return null;
  } catch {
    /* zenity missing */
  }
  throw new Error("Native folder picker is not available on this system");
}

export async function pickNativeFolder(): Promise<string | null> {
  let picked: string | null = null;
  if (process.platform === "win32") {
    picked = await pickWindowsFolder();
  } else if (process.platform === "darwin") {
    picked = await pickMacFolder();
  } else {
    picked = await pickLinuxFolder();
  }

  if (!picked) return null;

  const resolved = path.resolve(picked.trim());
  assertUnderAllowedRoots(resolved);
  return resolved;
}
