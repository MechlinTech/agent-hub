import { NextResponse } from "next/server";
import { requireRead, requireWrite } from "@/lib/supabase/get-auth-context";
import { getBlazeMeterOrgConfig, saveBlazeMeterOrgConfig } from "@/lib/blazemeter/org-settings";
import {
  mergeBlazeMeterOrgConfig,
  validateBlazeMeterOrgConfig,
  validateBlazeMeterCredentialsSave,
  isBlazeMeterIntegrationReady,
  hasBlazeMeterCredentials,
  sanitizeBlazeMeterConfigForClient,
  type BlazeMeterOrgConfig,
  type BlazeMeterPublicStatus,
} from "@/lib/blazemeter/types";

function buildStatus(config: BlazeMeterOrgConfig): BlazeMeterPublicStatus {
  const credentialsConfigured = hasBlazeMeterCredentials(config);
  return {
    credentialsConfigured,
    connected:
      isBlazeMeterIntegrationReady(config, credentialsConfigured) &&
      Boolean(config.lastValidatedAt),
    config: sanitizeBlazeMeterConfigForClient(config),
  };
}

export async function GET() {
  const { response } = await requireRead("integrations");
  if (response) return response;

  try {
    const config = await getBlazeMeterOrgConfig();
    return NextResponse.json(buildStatus(config));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load BlazeMeter settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { response } = await requireWrite("integrations");
  if (response) return response;

  try {
    const body = await request.json();
    const existing = await getBlazeMeterOrgConfig();
    const config = mergeBlazeMeterOrgConfig(existing, body);
    const credentialsOnly = Boolean(body.credentialsOnly);
    const validationError = credentialsOnly
      ? validateBlazeMeterCredentialsSave(config)
      : validateBlazeMeterOrgConfig(config);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    await saveBlazeMeterOrgConfig(config);
    const saved = await getBlazeMeterOrgConfig();
    return NextResponse.json(buildStatus(saved));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save BlazeMeter settings" },
      { status: 500 }
    );
  }
}
