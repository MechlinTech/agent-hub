import { NextResponse } from "next/server";
import { testBlazeMeterConnection, BlazeMeterApiError } from "@/lib/blazemeter/client";
import { getBlazeMeterOrgConfig, saveBlazeMeterOrgConfig } from "@/lib/blazemeter/org-settings";
import {
  mergeBlazeMeterOrgConfig,
  validateBlazeMeterOrgConfig,
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const existing = await getBlazeMeterOrgConfig();
    const config = mergeBlazeMeterOrgConfig(existing, {
      ...body,
      enabled: true,
    });
    const validationError = validateBlazeMeterOrgConfig(config);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    if (!hasBlazeMeterCredentials(config)) {
      return NextResponse.json(
        { error: "API Key ID and API Key Secret are required to test the connection." },
        { status: 400 }
      );
    }
    if (!config.accountId || !config.workspaceId || !config.projectId) {
      return NextResponse.json(
        { error: "Account, workspace, and project are required to test the connection." },
        { status: 400 }
      );
    }

    await saveBlazeMeterOrgConfig(config);

    await testBlazeMeterConnection({
      accountId: config.accountId,
      workspaceId: config.workspaceId,
      projectId: config.projectId,
    });

    const saved = {
      ...config,
      enabled: true,
      lastValidatedAt: new Date().toISOString(),
    };
    await saveBlazeMeterOrgConfig(saved);
    const persisted = await getBlazeMeterOrgConfig();
    return NextResponse.json(buildStatus(persisted));
  } catch (err) {
    const message =
      err instanceof BlazeMeterApiError || err instanceof Error
        ? err.message
        : "Connection test failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
