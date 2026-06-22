import { NextResponse } from "next/server";
import {
  listAccounts,
  listPerformanceTests,
  listProjects,
  listWorkspaces,
  BlazeMeterApiError,
} from "@/lib/blazemeter/client";
import { getBlazeMeterOrgConfig, saveBlazeMeterOrgConfig } from "@/lib/blazemeter/org-settings";
import {
  mergeBlazeMeterOrgConfig,
  sanitizeBlazeMeterConfigForClient,
  validateBlazeMeterCredentialsSave,
} from "@/lib/blazemeter/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const existing = await getBlazeMeterOrgConfig();

    const accounts = await listAccountsWithCredentials(existing, body);

    const accountId =
      toNullableId(body.accountId) ??
      existing.accountId ??
      (accounts.length === 1 ? accounts[0].id : null);

    let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
    if (accountId) {
      workspaces = await listWorkspaces(accountId);
    }

    const workspaceId =
      toNullableId(body.workspaceId) ??
      existing.workspaceId ??
      (workspaces.length === 1 ? workspaces[0].id : null);

    let projects: Awaited<ReturnType<typeof listProjects>> = [];
    if (workspaceId) {
      projects = await listProjects(workspaceId);
    }

    const projectId =
      toNullableId(body.projectId) ??
      existing.projectId ??
      (projects.length === 1 ? projects[0].id : null);

    let tests: Awaited<ReturnType<typeof listPerformanceTests>> = [];
    if (projectId && workspaceId) {
      tests = await listPerformanceTests(projectId, workspaceId);
    }

    const merged = mergeBlazeMeterOrgConfig(existing, {
      apiKeyId: body.apiKeyId,
      apiKeySecret: body.apiKeySecret,
      accountId,
      accountName: accounts.find((a) => a.id === accountId)?.name ?? existing.accountName,
      workspaceId,
      workspaceName: workspaces.find((w) => w.id === workspaceId)?.name ?? existing.workspaceName,
      projectId,
      projectName: projects.find((p) => p.id === projectId)?.name ?? existing.projectName,
    });

    const credentialsError = validateBlazeMeterCredentialsSave(merged);
    if (credentialsError) {
      return NextResponse.json({ error: credentialsError }, { status: 400 });
    }

    await saveBlazeMeterOrgConfig(merged);
    const persisted = await getBlazeMeterOrgConfig();

    return NextResponse.json({
      credentialsConfigured: true,
      config: sanitizeBlazeMeterConfigForClient(persisted),
      accounts,
      workspaces,
      projects,
      tests,
      suggested: {
        accountId,
        workspaceId,
        projectId,
        accountName: accounts.find((a) => a.id === accountId)?.name ?? null,
        workspaceName: workspaces.find((w) => w.id === workspaceId)?.name ?? null,
        projectName: projects.find((p) => p.id === projectId)?.name ?? null,
      },
    });
  } catch (err) {
    const message =
      err instanceof BlazeMeterApiError || err instanceof Error
        ? err.message
        : "Failed to fetch BlazeMeter details";
    const status = err instanceof BlazeMeterApiError && err.status ? err.status : 502;
    return NextResponse.json({ error: message }, { status: status >= 400 ? status : 502 });
  }
}

async function listAccountsWithCredentials(
  existing: Awaited<ReturnType<typeof getBlazeMeterOrgConfig>>,
  body: { apiKeyId?: string; apiKeySecret?: string }
) {
  const merged = mergeBlazeMeterOrgConfig(existing, {
    apiKeyId: body.apiKeyId,
    apiKeySecret: body.apiKeySecret,
  });
  const credentialsError = validateBlazeMeterCredentialsSave(merged);
  if (credentialsError) {
    throw new Error(credentialsError);
  }
  await saveBlazeMeterOrgConfig(merged);
  return listAccounts();
}

function toNullableId(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}
