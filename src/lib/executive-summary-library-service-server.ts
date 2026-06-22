import { createClient } from "@/lib/supabase/server";
import type {
  ExecutiveSummaryLibraryRecord,
  ScriptSummaryRow,
  TestContext,
} from "@/lib/results-analysis/types";

function rowToRecord(row: Record<string, unknown>): ExecutiveSummaryLibraryRecord {
  return {
    id: row.id as string,
    title: row.title as string,
    analysisId: (row.analysis_id as string | null) ?? null,
    externalAnalysisId: (row.external_analysis_id as string | null) ?? null,
    masterId: (row.master_id as string | null) ?? null,
    runName: row.run_name as string,
    environment: (row.environment as string | null) ?? null,
    projectName: (row.project_name as string | null) ?? null,
    buildVersion: (row.build_version as string | null) ?? null,
    bugId: (row.bug_id as string) ?? "",
    comments: (row.comments as string) ?? "",
    scriptSummaries: (row.script_summaries as ScriptSummaryRow[]) ?? [],
    scriptCount: row.script_count as number,
    passCount: row.pass_count as number,
    failCount: row.fail_count as number,
    exportedAt: row.exported_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listExecutiveSummaryLibrary(
  limit = 100
): Promise<ExecutiveSummaryLibraryRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("executive_summary_library")
    .select("*")
    .order("exported_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToRecord);
}

export async function getExecutiveSummaryLibraryEntry(
  id: string
): Promise<ExecutiveSummaryLibraryRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("executive_summary_library")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToRecord(data) : null;
}

export interface CreateExecutiveSummaryLibraryInput {
  analysisId?: string | null;
  runName: string;
  externalId?: string | null;
  masterId?: string | null;
  testContext?: Partial<TestContext> | null;
  scriptSummaries: ScriptSummaryRow[];
}

export async function createExecutiveSummaryLibraryEntry(
  input: CreateExecutiveSummaryLibraryInput
): Promise<ExecutiveSummaryLibraryRecord> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  const now = new Date().toISOString();
  const passCount = input.scriptSummaries.filter((row) => row.result === "pass").length;
  const failCount = input.scriptSummaries.length - passCount;

  const { data, error } = await supabase
    .from("executive_summary_library")
    .insert({
      title: input.runName.trim() || "Script-Level Executive Summary",
      analysis_id: input.analysisId ?? null,
      external_analysis_id: input.externalId ?? null,
      master_id: input.masterId ?? null,
      run_name: input.runName,
      environment: input.testContext?.environment ?? null,
      project_name: input.testContext?.projectName ?? null,
      build_version: input.testContext?.buildVersion ?? null,
      bug_id: "",
      comments: "",
      script_summaries: input.scriptSummaries,
      script_count: input.scriptSummaries.length,
      pass_count: passCount,
      fail_count: failCount,
      exported_at: now,
      updated_at: now,
      user_id: user.id,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToRecord(data);
}

export async function updateExecutiveSummaryLibraryEntry(
  id: string,
  patch: { bugId?: string; comments?: string; scriptSummaries?: ScriptSummaryRow[] }
): Promise<ExecutiveSummaryLibraryRecord | null> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.bugId !== undefined) updates.bug_id = patch.bugId;
  if (patch.comments !== undefined) updates.comments = patch.comments;
  if (patch.scriptSummaries !== undefined) updates.script_summaries = patch.scriptSummaries;

  const { data, error } = await supabase
    .from("executive_summary_library")
    .update(updates)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToRecord(data) : null;
}

export async function deleteExecutiveSummaryLibraryEntry(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("executive_summary_library")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}
