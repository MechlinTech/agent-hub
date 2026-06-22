import { getBlazeMeterOrgConfig } from "@/lib/blazemeter/org-settings";

export function hasBlazeMeterStoredCredentials(input: {
  apiKeyId?: string | null;
  apiKeySecret?: string | null;
}): boolean {
  return Boolean(input.apiKeyId?.trim() && input.apiKeySecret?.trim());
}

export function buildBlazeMeterAuthHeader(id: string, secret: string): string {
  const token = Buffer.from(`${id}:${secret}`).toString("base64");
  return `Basic ${token}`;
}

export async function resolveBlazeMeterCredentials(): Promise<{ id: string; secret: string }> {
  const config = await getBlazeMeterOrgConfig();
  const id = config.apiKeyId?.trim();
  const secret = config.apiKeySecret?.trim();
  if (id && secret) {
    return { id, secret };
  }
  throw new Error(
    "BlazeMeter API credentials are not configured. Add your API Key ID and Secret in Integrations → BlazeMeter."
  );
}
