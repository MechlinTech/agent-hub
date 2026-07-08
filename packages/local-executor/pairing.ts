import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

const CONFIG_DIR = path.join(os.homedir(), ".agenthub");
const CONFIG_FILE = path.join(CONFIG_DIR, "executor.json");

export interface ExecutorLocalConfig {
  tokenHash: string;
  pairedAt: string;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function loadExecutorConfig(): Promise<ExecutorLocalConfig | null> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, "utf8");
    return JSON.parse(raw) as ExecutorLocalConfig;
  } catch {
    return null;
  }
}

export async function saveExecutorConfig(token: string): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  const config: ExecutorLocalConfig = {
    tokenHash: hashToken(token),
    pairedAt: new Date().toISOString(),
  };
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
}

export async function isPaired(): Promise<boolean> {
  const config = await loadExecutorConfig();
  return Boolean(config?.tokenHash);
}

export async function verifyBearerToken(authHeader: string | null): Promise<boolean> {
  const token = extractBearerToken(authHeader);
  if (!token) return false;
  const config = await loadExecutorConfig();
  if (!config?.tokenHash) return false;
  return hashToken(token) === config.tokenHash;
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token || null;
}

export function isValidPairingToken(token: string): boolean {
  return token.length >= 16;
}

export async function pairExecutor(token: string): Promise<void> {
  if (!isValidPairingToken(token)) {
    throw new Error("Invalid pairing token");
  }
  await saveExecutorConfig(token);
}
