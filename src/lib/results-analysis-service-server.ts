import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SLA_PROFILE, DEFAULT_TEST_CONTEXT } from "@/lib/results-analysis/defaults";
import {
  buildUploadedFilesMeta,
  generateAnalysisId,
  runResultsAnalysis,
  type AnalysisFileBundle,
} from "@/lib/results-analysis/analysis-runner";
import type {
  ResultsAnalysisRecord,
  SlaProfile,
  TestContext,
} from "@/lib/results-analysis/types";

function rowToRecord(row: Record<string, unknown>): ResultsAnalysisRecord {
  return {
    id: row.id as string,
    externalId: row.external_id as string,
    runName: row.run_name as string,
    masterId: (row.master_id as string | null) ?? null,
    inputMethod: row.input_method as ResultsAnalysisRecord["inputMethod"],
    status: row.status as ResultsAnalysisRecord["status"],
    progressPercent: row.progress_percent as number,
    currentStep: (row.current_step as string | null) ?? null,
    testContext: row.test_context as TestContext,
    slaProfileId: (row.sla_profile_id as string | null) ?? null,
    uploadedFiles: row.uploaded_files as ResultsAnalysisRecord["uploadedFiles"],
    overallStatus: row.overall_status as ResultsAnalysisRecord["overallStatus"],
    performanceScore: (row.performance_score as number | null) ?? null,
    goNoGo: row.go_no_go as ResultsAnalysisRecord["goNoGo"],
    executiveSummary: (row.executive_summary as string | null) ?? null,
    topRisks: (row.top_risks as string[]) ?? [],
    resultPayload: row.result_payload as ResultsAnalysisRecord["resultPayload"],
    blazemeterSnapshot: (row.blazemeter_snapshot as ResultsAnalysisRecord["blazemeterSnapshot"]) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
    startedAt: row.started_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function slaRowToProfile(row: Record<string, unknown>): SlaProfile {
  const config = row.config as SlaProfile;
  return { ...config, id: row.id as string, name: row.name as string, isDefault: row.is_default as boolean };
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

export async function ensureDefaultSlaProfile(): Promise<void> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("sla_profiles")
    .select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) return;
  await supabase.from("sla_profiles").insert({
    id: DEFAULT_SLA_PROFILE.id,
    name: DEFAULT_SLA_PROFILE.name,
    config: DEFAULT_SLA_PROFILE,
    is_default: true,
  });
}

export async function listResultsAnalyses(limit = 20): Promise<ResultsAnalysisRecord[]> {
  await ensureDefaultSlaProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("results_analyses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(rowToRecord);
}

export async function getResultsAnalysis(id: string): Promise<ResultsAnalysisRecord | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("results_analyses").select("*").eq("id", id).single();
  return data ? rowToRecord(data) : null;
}

export async function getSlaProfiles(): Promise<SlaProfile[]> {
  await ensureDefaultSlaProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("sla_profiles").select("*").order("created_at", { ascending: false });
  return (data ?? []).map(slaRowToProfile);
}

export async function saveSlaProfile(profile: SlaProfile): Promise<SlaProfile> {
  const supabase = await createClient();
  const id = profile.id || randomUUID();
  if (profile.isDefault) {
    await supabase.from("sla_profiles").update({ is_default: false }).neq("id", id);
  }
  const { data, error } = await supabase
    .from("sla_profiles")
    .upsert({
      id,
      name: profile.name,
      config: profile,
      is_default: profile.isDefault ?? false,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return slaRowToProfile(data);
}

export async function createResultsAnalysis(input: {
  runName: string;
  testContext: TestContext;
  masterId?: string;
  inputMethod?: ResultsAnalysisRecord["inputMethod"];
}): Promise<{ analysisId: string }> {
  await ensureDefaultSlaProfile();
  const supabase = await createClient();
  const profiles = await getSlaProfiles();
  const defaultProfile = profiles.find((p) => p.isDefault) ?? DEFAULT_SLA_PROFILE;
  const analysisId = randomUUID();
  const now = new Date().toISOString();

  const { error } = await supabase.from("results_analyses").insert({
    id: analysisId,
    external_id: generateAnalysisId(),
    run_name: input.runName,
    master_id: input.masterId ?? null,
    input_method: input.inputMethod ?? "csv",
    status: "draft",
    progress_percent: 0,
    current_step: "Waiting for files",
    test_context: input.testContext,
    sla_profile_id: defaultProfile.id,
    uploaded_files: {},
    top_risks: [],
    started_at: now,
    created_at: now,
    updated_at: now,
  });
  if (error) throw new Error(error.message);
  return { analysisId };
}

const FILE_KEYS = ["requestStats", "errorStats", "timeline", "baseline", "jtl"] as const;

export async function uploadResultsFiles(
  analysisId: string,
  files: Partial<Record<(typeof FILE_KEYS)[number], { name: string; buffer: Buffer }>>
): Promise<ResultsAnalysisRecord> {
  const supabase = await createClient();
  const contents: AnalysisFileBundle = {};
  const metaFiles: Partial<Record<keyof AnalysisFileBundle, { name: string; size: number }>> = {};

  for (const key of FILE_KEYS) {
    const file = files[key];
    if (!file) continue;
    const storageName =
      key === "requestStats"
        ? "request-stats.csv"
        : key === "errorStats"
          ? "error-stats.csv"
          : key === "timeline"
            ? "timeline.csv"
            : key === "baseline"
              ? "baseline.csv"
              : file.name;
    const path = `${analysisId}/${storageName}`;
    const { error } = await supabase.storage.from("results-assets").upload(path, file.buffer, {
      upsert: true,
      contentType: key === "jtl" ? "text/plain" : "text/csv",
    });
    if (error) throw new Error(error.message);
    if (key !== "jtl") {
      contents[key] = file.buffer.toString("utf8");
      metaFiles[key] = { name: file.name, size: file.buffer.length };
    }
  }

  const uploadedFiles = buildUploadedFilesMeta(metaFiles, contents);
  const { error: updateError } = await supabase
    .from("results_analyses")
    .update({
      uploaded_files: uploadedFiles,
      status: uploadedFiles.requestStats?.valid ? "ready" : "uploading",
      updated_at: new Date().toISOString(),
    })
    .eq("id", analysisId);
  if (updateError) throw new Error(updateError.message);

  const record = await getResultsAnalysis(analysisId);
  if (!record) throw new Error("Analysis not found");
  return record;
}

async function loadAnalysisFiles(analysisId: string): Promise<AnalysisFileBundle> {
  const supabase = await createClient();
  const bundle: AnalysisFileBundle = {};
  const mapping: [keyof AnalysisFileBundle, string][] = [
    ["requestStats", "request-stats.csv"],
    ["errorStats", "error-stats.csv"],
    ["timeline", "timeline.csv"],
    ["baseline", "baseline.csv"],
  ];
  for (const [key, fileName] of mapping) {
    const path = `${analysisId}/${fileName}`;
    const { data, error } = await supabase.storage.from("results-assets").download(path);
    if (error || !data) continue;
    bundle[key] = await data.text();
  }
  return bundle;
}

export async function runAnalysisServer(analysisId: string): Promise<ResultsAnalysisRecord> {
  const existing = await getResultsAnalysis(analysisId);
  if (!existing) throw new Error("Analysis not found");

  const profiles = await getSlaProfiles();
  const slaProfile =
    profiles.find((p) => p.id === existing.slaProfileId) ??
    profiles.find((p) => p.isDefault) ??
    DEFAULT_SLA_PROFILE;

  const supabase = await createClient();
  await supabase
    .from("results_analyses")
    .update({
      status: "analyzing",
      progress_percent: 5,
      current_step: "Fetching summary metrics",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", analysisId);

  try {
    const files = await loadAnalysisFiles(analysisId);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    let aiRecommendationEnabled = false;
    if (user) {
      const { data: settings } = await supabase
        .from("user_settings")
        .select("ai_recommendation_mode")
        .eq("user_id", user.id)
        .single();
      aiRecommendationEnabled = settings?.ai_recommendation_mode === "enabled";
    }

    const result = await runResultsAnalysis({
      runName: existing.runName,
      context: existing.testContext,
      files,
      slaProfile,
      scenarioScriptSummaries: existing.blazemeterSnapshot?.scenarioScriptSummaries,
      aiRecommendationEnabled,
      onProgress: async (step, percent) => {
        await supabase
          .from("results_analyses")
          .update({
            current_step: step,
            progress_percent: percent,
            updated_at: new Date().toISOString(),
          })
          .eq("id", analysisId);
      },
    });

    const now = new Date().toISOString();
    await supabase
      .from("results_analyses")
      .update({
        status: "completed",
        progress_percent: 100,
        current_step: "Completed",
        overall_status: result.overallStatus,
        performance_score: result.performanceScore,
        go_no_go: result.goNoGo,
        executive_summary: result.executiveSummary,
        top_risks: result.topRisks,
        result_payload: result,
        completed_at: now,
        updated_at: now,
      })
      .eq("id", analysisId);

    await pushNotification({
      title: "Results analysis completed",
      subtitle: existing.runName,
      notification_type: "analysis_complete",
    });
  } catch (e) {
    await supabase
      .from("results_analyses")
      .update({
        status: "failed",
        error_message: e instanceof Error ? e.message : "Analysis failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysisId);

    await pushNotification({
      title: "Results analysis failed",
      subtitle: existing.runName,
      notification_type: "analysis_failed",
    });
    throw e;
  }

  const record = await getResultsAnalysis(analysisId);
  if (!record) throw new Error("Analysis not found");
  return record;
}

export async function isBlazeMeterConfigured(): Promise<boolean> {
  const { getBlazeMeterOrgConfig } = await import("@/lib/blazemeter/org-settings");
  const { hasBlazeMeterCredentials, isBlazeMeterIntegrationReady } = await import("@/lib/blazemeter/types");
  const cfg = await getBlazeMeterOrgConfig();
  return isBlazeMeterIntegrationReady(cfg, hasBlazeMeterCredentials(cfg));
}

async function saveAnalysisFileBundle(analysisId: string, files: AnalysisFileBundle) {
  const uploadMap: Partial<
    Record<"requestStats" | "errorStats" | "timeline" | "baseline", { name: string; buffer: Buffer }>
  > = {};
  if (files.requestStats) {
    uploadMap.requestStats = { name: "request-stats.csv", buffer: Buffer.from(files.requestStats, "utf8") };
  }
  if (files.errorStats) {
    uploadMap.errorStats = { name: "error-stats.csv", buffer: Buffer.from(files.errorStats, "utf8") };
  }
  if (files.timeline) {
    uploadMap.timeline = { name: "timeline.csv", buffer: Buffer.from(files.timeline, "utf8") };
  }
  if (files.baseline) {
    uploadMap.baseline = { name: "baseline.csv", buffer: Buffer.from(files.baseline, "utf8") };
  }
  return uploadResultsFiles(analysisId, uploadMap);
}

export async function listBlazeMeterTestRuns() {
  const { getBlazeMeterOrgConfig } = await import("@/lib/blazemeter/org-settings");
  const { listMasters } = await import("@/lib/blazemeter/client");
  const { hasBlazeMeterWorkspaceConfig } = await import("@/lib/blazemeter/types");
  const cfg = await getBlazeMeterOrgConfig();
  if (!hasBlazeMeterWorkspaceConfig(cfg)) {
    throw new Error("BlazeMeter is not configured. Set up the integration first.");
  }
  return listMasters({
    projectId: cfg.projectId!,
    workspaceId: cfg.workspaceId!,
    limit: 50,
  });
}

export async function previewBlazeMeterRun(masterId: string) {
  const { getMaster, downloadMasterReportText } = await import("@/lib/blazemeter/client");
  const { parseRequestStatsBundle } = await import("@/lib/results-analysis/csv-parser");
  const { aggregateSummaryMetrics } = await import("@/lib/results-analysis/score-engine");

  const master = await getMaster(masterId);
  const requestStatsCsv = await downloadMasterReportText(masterId, "aggregatereport");
  const requestBundle = parseRequestStatsBundle(requestStatsCsv);
  const summary = aggregateSummaryMetrics(requestBundle.transactions, requestBundle.totalRow);
  const created = master.created ? master.created * 1000 : Date.now();
  const ended = master.ended ? master.ended * 1000 : Date.now();

  return {
    masterId: String(master.id),
    runName: master.name?.trim() || `Run ${master.id}`,
    durationMinutes: Math.max(1, Math.round((ended - created) / 60000)),
    activeDurationMinutes: summary.activeDurationMinutes,
    maxUsers: master.maxUsers ?? 0,
    avgResponseTimeSec: summary.avgResponseTimeSec,
    p90ResponseTimeSec: summary.p90ResponseTimeSec,
    p95ResponseTimeSec: summary.p95ResponseTimeSec,
    p99ResponseTimeSec: summary.p99ResponseTimeSec,
    minResponseTimeSec: summary.minResponseTimeSec,
    maxResponseTimeSec: summary.maxResponseTimeSec,
    medianResponseTimeSec: summary.medianResponseTimeSec,
    stDevSec: summary.stDevSec,
    avgLatencySec: summary.avgLatencySec,
    errorRatePct: summary.errorRatePct,
    errorsCount: summary.errorsCount,
    throughput: summary.throughput,
    avgBandwidthKiBps: summary.avgBandwidthKiBps,
    totalSamples: summary.totalSamples,
    passed: master.passed,
    createdAt: new Date(created).toISOString(),
    endedAt: master.ended ? new Date(ended).toISOString() : null,
  };
}

export async function importBlazeMeterMaster(input: {
  masterId?: string;
  analysisId?: string;
  testContext?: Partial<TestContext>;
}) {
  const { fetchReportsForMaster } = await import("@/lib/blazemeter/results-import");
  const existing = input.analysisId ? await getResultsAnalysis(input.analysisId) : null;
  const masterId = input.masterId?.trim() || existing?.masterId;
  if (!masterId) {
    throw new Error("BlazeMeter master ID is required");
  }

  const imported = await fetchReportsForMaster(masterId);
  const activeDuration =
    imported.snapshot.master.activeDurationMinutes ?? imported.durationMinutes;
  const supabase = await createClient();

  if (existing) {
    const testContext: TestContext = {
      ...existing.testContext,
      ...input.testContext,
      targetUsers: imported.maxUsers || existing.testContext.targetUsers,
      durationMinutes: activeDuration || existing.testContext.durationMinutes,
    };

    await saveAnalysisFileBundle(existing.id, imported.files);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("results_analyses")
      .update({
        run_name: imported.runName,
        master_id: imported.masterId,
        input_method: "api",
        test_context: testContext,
        blazemeter_snapshot: imported.snapshot,
        status: "ready",
        progress_percent: 0,
        current_step: "Ready to analyze",
        overall_status: null,
        performance_score: null,
        go_no_go: null,
        executive_summary: null,
        top_risks: [],
        result_payload: null,
        error_message: null,
        completed_at: null,
        updated_at: now,
      })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);

    await pushNotification({
      title: "BlazeMeter run re-imported",
      subtitle: imported.runName,
      notification_type: "blazemeter_import_complete",
    });
    return { analysisId: existing.id, reimported: true as const };
  }

  const testContext: TestContext = {
    ...DEFAULT_TEST_CONTEXT,
    ...input.testContext,
    targetUsers: imported.maxUsers || input.testContext?.targetUsers || DEFAULT_TEST_CONTEXT.targetUsers,
    durationMinutes:
      activeDuration || input.testContext?.durationMinutes || DEFAULT_TEST_CONTEXT.durationMinutes,
  };

  const { analysisId } = await createResultsAnalysis({
    runName: imported.runName,
    testContext,
    masterId: imported.masterId,
    inputMethod: "api",
  });
  await saveAnalysisFileBundle(analysisId, imported.files);
  await supabase
    .from("results_analyses")
    .update({
      blazemeter_snapshot: imported.snapshot,
      updated_at: new Date().toISOString(),
    })
    .eq("id", analysisId);
  await pushNotification({
    title: "BlazeMeter run imported",
    subtitle: imported.runName,
    notification_type: "blazemeter_import_complete",
  });
  return { analysisId, reimported: false as const };
}
