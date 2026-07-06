export function normalizeExecutorVersion(version: string): string {
  return version.trim().replace(/^v/i, "");
}

export function buildExecutorBinaryStoragePath(version: string, fileName: string): string {
  const safeVersion = normalizeExecutorVersion(version).replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${safeVersion}/${safeName}`;
}
