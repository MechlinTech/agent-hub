import { createClient } from "@/lib/supabase/server";
import { normalizeExecutorVersion } from "@/lib/executor-binaries-shared";

const BUCKET = "executor_binaries";

export interface ExecutorBinaryRecord {
  id: string;
  name: string;
  version: string;
  path: string;
  createdAt: string;
  updatedAt: string;
}

function rowToRecord(row: Record<string, unknown>): ExecutorBinaryRecord {
  return {
    id: row.id as string,
    name: row.name as string,
    version: row.version as string,
    path: row.path as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listExecutorBinaries(): Promise<ExecutorBinaryRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("executor_binaries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => rowToRecord(row as Record<string, unknown>));
}

export async function getLatestExecutorBinary(): Promise<ExecutorBinaryRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("executor_binaries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToRecord(data as Record<string, unknown>) : null;
}

export async function getExecutorVersion(): Promise<string | null> {
  const binary = await getLatestExecutorBinary();
  return binary?.version?.trim() || null;
}

export async function registerExecutorBinary(input: {
  name: string;
  version: string;
  path: string;
}): Promise<ExecutorBinaryRecord> {
  const version = normalizeExecutorVersion(input.version);
  const name = input.name.trim();
  const path = input.path.trim();

  if (!version || !name || !path) {
    throw new Error("Name, version, and storage path are required");
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("executor_binaries")
    .insert({
      name,
      version,
      path,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return rowToRecord(data as Record<string, unknown>);
}

export async function getExecutorBinaryForVersion(
  version: string,
): Promise<ExecutorBinaryRecord | null> {
  const normalized = normalizeExecutorVersion(version);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("executor_binaries")
    .select("*")
    .eq("version", normalized)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToRecord(data as Record<string, unknown>) : null;
}

export async function getExecutorBinaryById(id: string): Promise<ExecutorBinaryRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("executor_binaries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToRecord(data as Record<string, unknown>) : null;
}

export async function getExecutorBinaryDownloadUrl(
  id: string,
): Promise<{ name: string; downloadUrl: string } | null> {
  const binary = await getExecutorBinaryById(id);
  if (!binary?.path) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(binary.path, 60 * 15);

  if (error || !data?.signedUrl) return null;

  return { name: binary.name, downloadUrl: data.signedUrl };
}

export async function deleteExecutorBinary(id: string): Promise<void> {
  const binary = await getExecutorBinaryById(id);
  if (!binary) throw new Error("Build not found");

  const supabase = await createClient();

  const { error: storageError } = await supabase.storage.from(BUCKET).remove([binary.path]);
  if (storageError) throw new Error(storageError.message);

  const { error: deleteError } = await supabase.from("executor_binaries").delete().eq("id", id);
  if (deleteError) throw new Error(deleteError.message);
}

export async function getLatestExecutorDownload(): Promise<{
  version: string;
  name: string;
  downloadUrl: string;
} | null> {
  const binary = await getLatestExecutorBinary();
  if (!binary?.path) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(binary.path, 60 * 15);

  if (error || !data?.signedUrl) return null;

  return {
    version: binary.version,
    name: binary.name,
    downloadUrl: data.signedUrl,
  };
}
