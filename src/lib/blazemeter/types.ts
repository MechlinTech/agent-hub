export type BlazeMeterTestProvisioningMode = "create_per_review" | "reuse_existing";

export interface BlazeMeterOrgConfig {
  enabled: boolean;
  apiKeyId: string | null;
  apiKeySecret: string | null;
  testProvisioningMode: BlazeMeterTestProvisioningMode;
  accountId: number | null;
  workspaceId: number | null;
  projectId: number | null;
  accountName: string | null;
  workspaceName: string | null;
  projectName: string | null;
  reuseTestId: number | null;
  reuseTestName: string | null;
  defaultLocation: string;
  lastValidatedAt: string | null;
}

export interface BlazeMeterPublicStatus {
  credentialsConfigured: boolean;
  connected: boolean;
  config: BlazeMeterOrgConfig;
}

export interface BlazeMeterNamedEntity {
  id: number;
  name: string;
}

export const DEFAULT_BLAZEMETER_ORG_CONFIG: BlazeMeterOrgConfig = {
  enabled: false,
  apiKeyId: null,
  apiKeySecret: null,
  testProvisioningMode: "create_per_review",
  accountId: null,
  workspaceId: null,
  projectId: null,
  accountName: null,
  workspaceName: null,
  projectName: null,
  reuseTestId: null,
  reuseTestName: null,
  defaultLocation: "us-east-1",
  lastValidatedAt: null,
};

function toNullableId(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s || null;
}

export function hasBlazeMeterCredentials(config: BlazeMeterOrgConfig): boolean {
  return Boolean(config.apiKeyId?.trim() && config.apiKeySecret?.trim());
}

export function sanitizeBlazeMeterConfigForClient(config: BlazeMeterOrgConfig): BlazeMeterOrgConfig {
  return {
    ...config,
    apiKeySecret: null,
  };
}

export function mergeBlazeMeterOrgConfig(
  existing: BlazeMeterOrgConfig,
  patch: Partial<BlazeMeterOrgConfig>
): BlazeMeterOrgConfig {
  const credentialsChanged =
    (patch.apiKeyId !== undefined && toNullableString(patch.apiKeyId) !== existing.apiKeyId) ||
    Boolean(patch.apiKeySecret?.trim());

  const workspaceChanged =
    (patch.accountId !== undefined && toNullableId(patch.accountId) !== existing.accountId) ||
    (patch.workspaceId !== undefined && toNullableId(patch.workspaceId) !== existing.workspaceId) ||
    (patch.projectId !== undefined && toNullableId(patch.projectId) !== existing.projectId);

  const merged: BlazeMeterOrgConfig = { ...existing, ...patch };

  if (!patch.apiKeySecret?.trim()) {
    merged.apiKeySecret = existing.apiKeySecret;
  } else {
    merged.apiKeySecret = patch.apiKeySecret.trim();
  }
  if (patch.apiKeyId !== undefined) {
    merged.apiKeyId = toNullableString(patch.apiKeyId);
  }

  if (credentialsChanged || workspaceChanged) {
    merged.lastValidatedAt = null;
  } else if (patch.lastValidatedAt === undefined || patch.lastValidatedAt === null) {
    merged.lastValidatedAt = existing.lastValidatedAt;
  }

  return parseBlazeMeterOrgConfig(merged);
}

/** Payload for PUT from the browser (secret and validation timestamp omitted when unchanged). */
export function buildBlazeMeterSavePayload(
  config: BlazeMeterOrgConfig
): Partial<BlazeMeterOrgConfig> {
  const payload: Partial<BlazeMeterOrgConfig> = { ...config };
  if (!payload.apiKeySecret?.trim()) {
    delete payload.apiKeySecret;
  }
  delete payload.lastValidatedAt;
  return payload;
}

export function parseBlazeMeterOrgConfig(input: Partial<BlazeMeterOrgConfig>): BlazeMeterOrgConfig {
  const mode =
    input.testProvisioningMode === "reuse_existing" ? "reuse_existing" : "create_per_review";

  return {
    enabled: Boolean(input.enabled),
    apiKeyId: toNullableString(input.apiKeyId),
    apiKeySecret: toNullableString(input.apiKeySecret),
    testProvisioningMode: mode,
    accountId: toNullableId(input.accountId),
    workspaceId: toNullableId(input.workspaceId),
    projectId: toNullableId(input.projectId),
    accountName: toNullableString(input.accountName),
    workspaceName: toNullableString(input.workspaceName),
    projectName: toNullableString(input.projectName),
    reuseTestId: mode === "reuse_existing" ? toNullableId(input.reuseTestId) : null,
    reuseTestName: mode === "reuse_existing" ? toNullableString(input.reuseTestName) : null,
    defaultLocation: input.defaultLocation?.trim() || "us-east-1",
    lastValidatedAt: toNullableString(input.lastValidatedAt),
  };
}

export function hasBlazeMeterWorkspaceConfig(config: BlazeMeterOrgConfig): boolean {
  return Boolean(config.accountId && config.workspaceId && config.projectId);
}

export function isBlazeMeterIntegrationReady(
  config: BlazeMeterOrgConfig,
  credentialsConfigured: boolean
): boolean {
  return credentialsConfigured && hasBlazeMeterWorkspaceConfig(config);
}

export function validateBlazeMeterCredentialsSave(config: BlazeMeterOrgConfig): string | null {
  if (!hasBlazeMeterCredentials(config)) {
    return "API Key ID and API Key Secret are required.";
  }
  return null;
}

export function validateBlazeMeterOrgConfig(config: BlazeMeterOrgConfig): string | null {
  if (!config.enabled) return null;
  if (!hasBlazeMeterCredentials(config)) {
    return "API Key ID and API Key Secret are required when BlazeMeter is enabled.";
  }
  if (!config.accountId) return "Account ID is required when BlazeMeter is enabled.";
  if (!config.workspaceId) return "Workspace is required when BlazeMeter is enabled.";
  if (!config.projectId) return "Project is required when BlazeMeter is enabled.";
  if (config.testProvisioningMode === "reuse_existing" && !config.reuseTestId) {
    return "Select an existing BlazeMeter test when using reuse mode.";
  }
  if (!config.defaultLocation.trim()) return "Default cloud location is required.";
  return null;
}
