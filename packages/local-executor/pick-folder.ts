import { spawn } from "child_process";
import path from "path";
import { assertUnderAllowedRoots } from "../../src/lib/execution/sanitize";

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

function parsePickerResult(
  stdout: string,
  code: number | null
): string | null | "failed" {
  const picked = stdout.trim();
  if (code === 0 && picked) return picked;
  if (code === 1 && !picked) return null;
  return "failed";
}

/** .NET 8+ OpenFolderDialog via PowerShell 7 — full Explorer-style picker on Windows 11. */
async function pickWindowsFolderViaPwsh(): Promise<string | null | "failed" | "unavailable"> {
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "Add-Type -AssemblyName PresentationFramework",
    "$dialog = New-Object Microsoft.Win32.OpenFolderDialog",
    "$dialog.Title = 'Select project location'",
    "if ($dialog.ShowDialog()) {",
    "  [Console]::Out.Write($dialog.FolderName)",
    "  exit 0",
    "}",
    "exit 1",
  ].join("; ");

  try {
    const { stdout, code } = await runCommand(
      "pwsh.exe",
      ["-NoProfile", "-STA", "-Command", script],
      { windowsHide: false }
    );
    const result = parsePickerResult(stdout, code);
    return result === "failed" ? "failed" : result;
  } catch {
    return "unavailable";
  }
}

/**
 * FolderBrowserDialog with AutoUpgradeEnabled uses IFileDialog (Vista+ Explorer UI),
 * not the legacy SHBrowseForFolder tree. Inline -Command only — no .ps1 script file.
 */
async function pickWindowsFolderUpgraded(): Promise<string | null> {
  const script = [
    "Add-Type -AssemblyName System.Windows.Forms",
    "[System.Windows.Forms.Application]::EnableVisualStyles()",
    "$dialog = New-Object System.Windows.Forms.FolderBrowserDialog",
    "$dialog.AutoUpgradeEnabled = $true",
    "$dialog.UseDescriptionForTitle = $true",
    "$dialog.Description = 'Select project location'",
    "$dialog.ShowNewFolderButton = $true",
    "if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {",
    "  [Console]::Out.Write($dialog.SelectedPath)",
    "  exit 0",
    "}",
    "exit 1",
  ].join("; ");

  const { stdout, code } = await runCommand(
    "powershell.exe",
    ["-NoProfile", "-STA", "-Command", script],
    { windowsHide: false }
  );

  const result = parsePickerResult(stdout, code);
  if (result === "failed") throw new Error("Folder picker failed");
  return result;
}

async function pickWindowsFolder(): Promise<string | null> {
  const pwshResult = await pickWindowsFolderViaPwsh();
  if (pwshResult !== "unavailable" && pwshResult !== "failed") {
    return pwshResult;
  }

  return pickWindowsFolderUpgraded();
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
