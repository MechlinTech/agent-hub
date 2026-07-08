import { randomUUID, randomBytes, createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import type {
  ProjectSetupConfig,
  ProjectSetupLogEntry,
  ProjectSetupRecord,
  ProjectSetupResult,
  ProjectSetupStatus,
} from "@/lib/project-setup/types";
import { projectSetupConfigSchema } from "@/lib/project-setup/schemas";

function generateProjectSetupId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `PS-${y}${m}${d}-${suffix}`;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function rowToRecord(row: Record<string, unknown>): ProjectSetupRecord {
  return {
    id: row.id as string,
    externalId: row.external_id as string,
    projectName: row.project_name as string,
    projectScope: row.project_scope as ProjectSetupRecord["projectScope"],
    locationPath: row.location_path as string,
    config: row.config as ProjectSetupConfig,
    status: row.status as ProjectSetupStatus,
    progressPercent: row.progress_percent as number,
    currentStep: (row.current_step as string | null) ?? null,
    result: (row.result as ProjectSetupResult | null) ?? null,
    logs: (row.logs as ProjectSetupLogEntry[]) ?? [],
    errorMessage: (row.error_message as string | null) ?? null,
    startedAt: (row.started_at as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

async function pushNotification(input: {
  title: string;
  subtitle: string;
  notification_type: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notifications").insert({
    user_id: user.id,
    title: input.title,
    subtitle: input.subtitle,
    notification_type: input.notification_type,
  });
}

export async function listProjectSetups(limit = 20): Promise<ProjectSetupRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_setups")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(rowToRecord);
}

export async function getProjectSetup(id: string): Promise<ProjectSetupRecord | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("project_setups").select("*").eq("id", id).single();
  return data ? rowToRecord(data) : null;
}

export async function createProjectSetup(
  config: ProjectSetupConfig
): Promise<{ id: string; externalId: string }> {
  const parsed = projectSetupConfigSchema.parse(config);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = randomUUID();
  const now = new Date().toISOString();
  const externalId = generateProjectSetupId();

  const { error } = await supabase.from("project_setups").insert({
    id,
    user_id: user.id,
    external_id: externalId,
    project_name: parsed.projectName,
    project_scope: parsed.projectScope,
    location_path: parsed.locationPath,
    config: parsed,
    status: "draft",
    progress_percent: 0,
    current_step: null,
    result: null,
    logs: [],
    error_message: null,
    started_at: null,
    completed_at: null,
    created_at: now,
    updated_at: now,
  });

  if (error) throw new Error(error.message);
  return { id, externalId };
}

export async function syncProjectSetup(
  id: string,
  input: {
    status: ProjectSetupStatus;
    progressPercent?: number;
    currentStep?: string | null;
    logs?: ProjectSetupLogEntry[];
    result?: ProjectSetupResult | null;
    errorMessage?: string | null;
  }
): Promise<ProjectSetupRecord> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const existing = await getProjectSetup(id);
  if (!existing) throw new Error("Setup not found");

  const mergedLogs = input.logs?.length
    ? [...existing.logs, ...input.logs]
    : existing.logs;

  const patch: Record<string, unknown> = {
    status: input.status,
    progress_percent: input.progressPercent ?? existing.progressPercent,
    current_step: input.currentStep ?? existing.currentStep,
    logs: mergedLogs,
    updated_at: now,
  };

  if (input.result !== undefined) patch.result = input.result;
  if (input.errorMessage !== undefined) patch.error_message = input.errorMessage;
  if (input.status === "generating" && !existing.startedAt) patch.started_at = now;
  if (input.status === "completed" || input.status === "failed") {
    patch.completed_at = now;
    patch.progress_percent = input.status === "completed" ? 100 : input.progressPercent ?? 0;
  }

  const { data, error } = await supabase
    .from("project_setups")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  if (input.status === "completed" && input.result?.success) {
    await pushNotification({
      title: "Project setup complete",
      subtitle: `${input.result.projectName} at ${input.result.location}`,
      notification_type: "project_setup_complete",
    });
  }

  return rowToRecord(data);
}

export async function regenerateExecutorToken(
  executorVersion?: string | null,
): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const now = new Date().toISOString();
  const version = executorVersion?.trim().replace(/^v/i, "") || null;

  const row: Record<string, unknown> = {
    user_id: user.id,
    token_hash: tokenHash,
    rotated_at: now,
    created_at: now,
  };
  if (version) {
    row.version = version;
  }

  const { error } = await supabase.from("executor_pairing_tokens").upsert(row);

  if (error) throw new Error(error.message);
  return token;
}

export async function revealExecutorToken(): Promise<string> {
  return regenerateExecutorToken();
}

export async function hasExecutorToken(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("executor_pairing_tokens")
    .select("user_id, version")
    .eq("user_id", user.id)
    .maybeSingle();
  return Boolean(data);
}