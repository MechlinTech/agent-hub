export function isProjectSetupEnabled(): boolean {
  const flag = process.env.PROJECT_SETUP_ENABLED;
  if (flag === "false" || flag === "0") return false;
  return true;
}

/** Empty = any absolute path the user chooses (Windows, macOS, Linux). Set env to restrict. */
export function getAllowedRoots(): string[] {
  const raw = process.env.PROJECT_SETUP_ALLOWED_ROOTS?.trim();
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function getExecutorPort(): number {
  const port = Number(process.env.EXECUTOR_PORT ?? "8787");
  return Number.isFinite(port) ? port : 8787;
}

export function getAllowedCorsOrigins(): string[] {
  const site =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.AGENTHUB_SITE_URL ??
    "http://localhost:3040";
  const extras = process.env.EXECUTOR_CORS_ORIGINS ?? "";
  const list = [
    site,
    "http://localhost:3040",
    "http://127.0.0.1:3040",
    "http://localhost:1420", // Tauri dev UI (agenthub-desktop tauri.conf.json devUrl)
  ];
  for (const o of extras.split(",")) {
    const t = o.trim();
    if (t) list.push(t);
  }
  return Array.from(new Set(list));
}
