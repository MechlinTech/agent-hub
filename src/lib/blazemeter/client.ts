import { buildBlazeMeterAuthHeader, resolveBlazeMeterCredentials } from "@/lib/blazemeter/credentials";

const DEFAULT_BASE_URL = "https://a.blazemeter.com/api/v4";

export interface BlazeMeterApiResponse<T> {
  api_version?: number;
  error: { message?: string; code?: string } | null;
  result: T;
  limit?: number;
  skip?: number;
  total?: number;
}

export class BlazeMeterApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "BlazeMeterApiError";
  }
}

function extractBlazeMeterError(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const err = obj.error;
    if (typeof err === "string" && err.trim()) return err;
    if (err && typeof err === "object") {
      const nested = err as Record<string, unknown>;
      if (typeof nested.message === "string" && nested.message.trim()) {
        return nested.message;
      }
      if (typeof nested.code === "string" && nested.code.trim()) {
        return nested.code;
      }
    }
    if (typeof obj.message === "string" && obj.message.trim()) {
      return obj.message;
    }
  }

  if (status === 401) {
    return "Unauthorized. Check your BlazeMeter API Key ID and Secret in Integrations → BlazeMeter.";
  }
  if (status === 403) {
    return "Forbidden. This API key does not have access to the requested account.";
  }
  if (status === 404) {
    return "Not found. Verify the Account ID (use Load accounts instead of guessing from the URL).";
  }

  return `BlazeMeter API request failed (HTTP ${status})`;
}

function getBaseUrl(): string {
  return process.env.BLAZEMETER_API_BASE?.replace(/\/$/, "") || DEFAULT_BASE_URL;
}

async function getAuthHeader(): Promise<string> {
  try {
    const { id, secret } = await resolveBlazeMeterCredentials();
    return buildBlazeMeterAuthHeader(id, secret);
  } catch (err) {
    throw new BlazeMeterApiError(
      err instanceof Error ? err.message : "BlazeMeter API credentials are not configured."
    );
  }
}

async function parseResponse<T>(res: Response): Promise<BlazeMeterApiResponse<T>> {
  const raw = await res.text();
  let data: BlazeMeterApiResponse<T> | unknown;
  try {
    data = raw ? (JSON.parse(raw) as BlazeMeterApiResponse<T>) : {};
  } catch {
    throw new BlazeMeterApiError(
      raw.trim()
        ? `BlazeMeter API returned non-JSON (${res.status}): ${raw.slice(0, 200)}`
        : `BlazeMeter API returned empty response (${res.status})`,
      res.status
    );
  }

  const payload = data as BlazeMeterApiResponse<T>;
  if (!res.ok || payload.error) {
    throw new BlazeMeterApiError(extractBlazeMeterError(payload, res.status), res.status);
  }

  return payload;
}

export async function blazeMeterRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<BlazeMeterApiResponse<T>> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", await getAuthHeader());
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  return parseResponse<T>(res);
}

export async function verifyBlazeMeterCredentials() {
  await blazeMeterRequest<{ id: number; email?: string }>("/user");
  return { ok: true as const };
}

export async function listAccounts() {
  const data = await blazeMeterRequest<Array<{ id: number; name?: string }>>("/accounts?limit=100");
  return (data.result ?? []).map((a) => ({
    id: a.id,
    name: a.name?.trim() || `Account ${a.id}`,
  }));
}

export async function listWorkspaces(accountId: number) {
  const data = await blazeMeterRequest<Array<{ id: number; name: string }>>(
    `/workspaces?accountId=${accountId}&limit=100`
  );
  return (data.result ?? []).map((w) => ({ id: w.id, name: w.name }));
}

export async function listProjects(workspaceId: number) {
  const data = await blazeMeterRequest<Array<{ id: number; name: string }>>(
    `/projects?workspaceId=${workspaceId}&limit=100`
  );
  return (data.result ?? []).map((p) => ({ id: p.id, name: p.name }));
}

export async function listPerformanceTests(projectId: number, workspaceId: number) {
  const params = new URLSearchParams({
    projectId: String(projectId),
    workspaceId: String(workspaceId),
    type: "taurus",
    limit: "100",
  });
  const data = await blazeMeterRequest<
    Array<{ id: number; name: string; configuration?: { filename?: string } }>
  >(`/tests?${params.toString()}`);
  return (data.result ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    filename: t.configuration?.filename ?? null,
  }));
}

export async function testBlazeMeterConnection(input: {
  accountId: number;
  workspaceId: number;
  projectId: number;
}) {
  await verifyBlazeMeterCredentials();
  await listWorkspaces(input.accountId);
  const projects = await listProjects(input.workspaceId);
  if (!projects.some((p) => p.id === input.projectId)) {
    throw new BlazeMeterApiError("Selected project was not found in the configured workspace.");
  }
  return { ok: true as const };
}

export interface BlazeMeterScenarioMapping {
  id: string;
  /** Human-readable scenario/test name from BlazeMeter (e.g. 01_DriveIn_MOI_FBC). */
  name: string;
  /** Internal BlazeMeter scenario key (e.g. default-scenario-15476764). */
  internalName?: string;
  test?: string;
  isEndUserExperience?: boolean;
}

function isDefaultScenarioName(value: string): boolean {
  return /^default-scenario-\d+$/i.test(value.trim());
}

export function resolveScenarioDisplayName(input: {
  id?: string;
  name?: string;
  scenario?: string;
  test?: string;
}): string {
  const test = input.test?.trim();
  if (test) return test;

  const name = (input.name ?? "").trim();
  const scenario = (input.scenario ?? "").trim();

  if (name && !isDefaultScenarioName(name)) return name;
  if (scenario && !isDefaultScenarioName(scenario)) return scenario;
  if (name) return name;
  if (scenario) return scenario;
  return input.id ? `Scenario ${input.id}` : "Unknown scenario";
}

export interface BlazeMeterScenarioExecution {
  concurrency?: number;
  iterations?: number;
  scenario?: string;
}

export interface BlazeMeterMasterListItem {
  id: number;
  name: string;
  testId: number | null;
  created: number;
  ended: number | null;
  maxUsers: number | null;
  passed: boolean | null;
  note: string | null;
  scenariosMapping?: BlazeMeterScenarioMapping[];
  executions?: BlazeMeterScenarioExecution[];
}

export interface BlazeMeterErrorsReportLabel {
  labelId?: string;
  name: string;
  errors?: Array<{
    rc?: string;
    m?: string;
    count?: number;
    body?: string;
    responseBody?: string;
  }>;
  assertions?: Array<{
    name?: string;
    failureMessage?: string;
    failures?: number;
  }>;
  failedEmbeddedResources?: Array<{
    rc?: string;
    rm?: string;
    count?: number;
  }>;
  urls?: Array<{ url?: string; count?: number }>;
}

export interface BlazeMeterAggregateReportRow {
  labelName: string;
  labelId?: string;
  samples?: number;
  errorsCount?: number;
  errorsRate?: number;
  concurrency?: number;
  avgResponseTime?: number;
  avgThroughput?: number;
  minResponseTime?: number;
  maxResponseTime?: number;
  medianResponseTime?: number;
  /** BlazeMeter API uses 90line, 95line, 99line */
  "90line"?: number;
  "95line"?: number;
  "99line"?: number;
  avgBytes?: number;
  stDev?: number;
  duration?: number;
}

export async function listMasters(input: {
  projectId: number;
  workspaceId: number;
  limit?: number;
  skip?: number;
}) {
  const params = new URLSearchParams({
    projectId: String(input.projectId),
    workspaceId: String(input.workspaceId),
    limit: String(input.limit ?? 50),
    skip: String(input.skip ?? 0),
  });
  const data = await blazeMeterRequest<BlazeMeterMasterListItem[]>(`/masters?${params.toString()}`);
  return (data.result ?? []).map((m) => ({
    id: m.id,
    name: m.name?.trim() || `Run ${m.id}`,
    testId: m.testId ?? null,
    created: m.created,
    ended: m.ended,
    maxUsers: m.maxUsers,
    passed: m.passed,
    note: m.note,
  }));
}

function normalizeScenarioMapping(
  raw: Array<{
    id?: string;
    name?: string;
    scenario?: string;
    test?: string;
    isEndUserExperience?: boolean;
  }>
): BlazeMeterScenarioMapping[] {
  return (raw ?? [])
    .filter((s) => Boolean(s.id))
    .map((s) => {
      const internalName = (s.name ?? s.scenario ?? "").trim() || undefined;
      return {
        id: String(s.id),
        name: resolveScenarioDisplayName(s),
        internalName: internalName && isDefaultScenarioName(internalName) ? internalName : internalName,
        test: s.test?.trim() || undefined,
        isEndUserExperience: s.isEndUserExperience ?? false,
      };
    });
}

export async function getMaster(masterId: string | number): Promise<BlazeMeterMasterListItem> {
  const data = await blazeMeterRequest<
    BlazeMeterMasterListItem & {
      scenariosMapping?: Array<{
        id?: string;
        name?: string;
        scenario?: string;
        test?: string;
        isEndUserExperience?: boolean;
      }>;
      executions?: BlazeMeterScenarioExecution[];
    }
  >(`/masters/${masterId}`);
  const m = data.result;
  return {
    ...m,
    scenariosMapping: normalizeScenarioMapping(m.scenariosMapping ?? []),
    executions: m.executions ?? [],
  };
}

function findScenarioExecution(
  executions: BlazeMeterScenarioExecution[] | undefined,
  scenario: BlazeMeterScenarioMapping
): BlazeMeterScenarioExecution | undefined {
  if (!executions?.length) return undefined;
  const keys = new Set(
    [scenario.internalName, scenario.id, scenario.name, scenario.test]
      .map((value) => value?.trim())
      .filter(Boolean) as string[]
  );
  return executions.find((execution) => {
    const scenarioKey = execution.scenario?.trim();
    return scenarioKey ? keys.has(scenarioKey) : false;
  });
}

export async function fetchErrorsReportData(
  masterId: string | number,
  scenarioIds?: string[]
): Promise<BlazeMeterErrorsReportLabel[]> {
  const params = new URLSearchParams();
  for (const id of scenarioIds ?? []) {
    params.append("scenarios[]", id);
  }
  const qs = params.toString();
  const path = `/masters/${masterId}/reports/errorsreport/data${qs ? `?${qs}` : ""}`;
  const data = await blazeMeterRequest<BlazeMeterErrorsReportLabel[]>(path);
  return data.result ?? [];
}

export async function fetchAggregateReportData(
  masterId: string | number,
  scenarioIds?: string[]
): Promise<BlazeMeterAggregateReportRow[]> {
  const params = new URLSearchParams();
  for (const id of scenarioIds ?? []) {
    params.append("scenarios[]", id);
  }
  const qs = params.toString();
  const path = `/masters/${masterId}/reports/aggregatereport/data${qs ? `?${qs}` : ""}`;
  const data = await blazeMeterRequest<BlazeMeterAggregateReportRow[]>(path);
  return data.result ?? [];
}

async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

/** Per-scenario script summaries for multi-script BlazeMeter workflow runs. */
export async function fetchScenarioScriptSummaries(masterId: string | number) {
  const master = await getMaster(masterId);
  const scenarios = (master.scenariosMapping ?? []).filter((s) => !s.isEndUserExperience);
  if (scenarios.length <= 1) return [];

  const { buildScriptSummaryFromScenarioData } = await import(
    "@/lib/results-analysis/script-summary"
  );

  return mapInBatches(scenarios, 6, async (scenario) => {
    try {
      const [aggregateRows, errorLabels] = await Promise.all([
        fetchAggregateReportData(masterId, [scenario.id]),
        fetchErrorsReportData(masterId, [scenario.id]).catch(() => []),
      ]);
      const execution = findScenarioExecution(master.executions, scenario);
      const { mapBlazeMeterAggregateRow } = await import("@/lib/results-analysis/script-summary");
      return buildScriptSummaryFromScenarioData({
        scriptName: scenario.name,
        aggregateRows: aggregateRows.map(mapBlazeMeterAggregateRow),
        errorLabels,
        execution,
      });
    } catch {
      return buildScriptSummaryFromScenarioData({
        scriptName: scenario.name,
        aggregateRows: [],
        errorLabels: [],
        execution: findScenarioExecution(master.executions, scenario),
      });
    }
  });
}

export async function downloadMasterReportText(
  masterId: string | number,
  reportId: "aggregatereport" | "errorsreport"
): Promise<string> {
  const headers = new Headers();
  headers.set("Authorization", await getAuthHeader());
  const res = await fetch(
    `${getBaseUrl()}/masters/${masterId}/reports/${reportId}/data.csv`,
    { headers, cache: "no-store" }
  );
  if (res.ok) {
    return res.text();
  }

  if (reportId === "errorsreport") {
    const jsonRes = await fetch(
      `${getBaseUrl()}/masters/${masterId}/reports/errorsreport/data`,
      { headers, cache: "no-store" }
    );
    const raw = await jsonRes.text();
    if (!jsonRes.ok) {
      throw new BlazeMeterApiError(extractBlazeMeterError(raw ? JSON.parse(raw) : {}, jsonRes.status), jsonRes.status);
    }
    return errorsReportJsonToCsv(JSON.parse(raw));
  }

  throw new BlazeMeterApiError(extractBlazeMeterError(await res.text(), res.status), res.status);
}

function errorsReportJsonToCsv(payload: unknown): string {
  const rows: string[] = ["Label,Response Code,Response Message,# Samples"];
  const obj = payload as {
    result?: {
      failures?: Array<{
        labelName?: string;
        responseCode?: string | number;
        responseMessage?: string;
        failures?: number;
        count?: number;
      }>;
    };
  };
  const failures = obj.result?.failures ?? [];
  for (const item of failures) {
    const label = (item.labelName ?? "Unknown").replace(/,/g, " ");
    const code = String(item.responseCode ?? "0");
    const message = (item.responseMessage ?? "Error").replace(/,/g, " ");
    const count = item.failures ?? item.count ?? 0;
    rows.push(`${label},${code},${message},${count}`);
  }
  return rows.join("\n");
}

export async function fetchMasterKpiTimeline(
  masterId: string | number,
  kpi = "ec"
): Promise<string | undefined> {
  const points = await fetchMasterKpiPoints(masterId, kpi, "sum", 60);
  if (points.length === 0) return undefined;
  const rows = ["Time,Errors,Status"];
  for (const p of points) {
    rows.push(`${p.time},${p.value},${p.value > 0 ? "fail" : "pass"}`);
  }
  return rows.join("\n");
}

function extractKpiValue(point: Record<string, unknown>, kpi: string, op: string): number {
  const candidates = [`${kpi}_${op}`, `${kpi}Avg`, `${kpi}_avg`, kpi, "n"];
  for (const key of candidates) {
    const val = point[key];
    if (typeof val === "number" && Number.isFinite(val)) return val;
  }
  for (const [key, val] of Object.entries(point)) {
    if (key.startsWith(`${kpi}_`) && typeof val === "number" && Number.isFinite(val)) return val;
  }
  return 0;
}

export async function fetchMasterKpiPoints(
  masterId: string | number,
  kpi: string,
  op = "avg",
  interval = 60
): Promise<Array<{ time: string; ts: number; value: number }>> {
  try {
    const headers = new Headers();
    headers.set("Authorization", await getAuthHeader());
    const params = new URLSearchParams({
      "master_ids[]": String(masterId),
      "kpis[]": kpi,
      "ops[]": op,
      interval: String(interval),
    });
    const res = await fetch(`${getBaseUrl()}/data/kpis?${params.toString()}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { result?: Array<Record<string, unknown>> };
    const points = data.result ?? [];
    return points
      .map((p) => {
        const ts = typeof p.ts === "number" ? p.ts : 0;
        return {
          time: ts ? new Date(ts * 1000).toISOString() : "unknown",
          ts,
          value: extractKpiValue(p, kpi, op),
        };
      })
      .filter((p) => p.ts > 0);
  } catch {
    return [];
  }
}

export async function fetchMasterKpiTimelineBundle(masterId: string | number) {
  const interval = 60;
  const [hitsPerSec, responseTimeMs, errors, bandwidthKiBps, activeThreads] = await Promise.all([
    fetchMasterKpiPoints(masterId, "n", "avg", interval),
    fetchMasterKpiPoints(masterId, "t", "avg", interval),
    fetchMasterKpiPoints(masterId, "ec", "sum", interval),
    fetchMasterKpiPoints(masterId, "by", "avg", interval),
    fetchMasterKpiPoints(masterId, "na", "avg", interval),
  ]);
  return { hitsPerSec, responseTimeMs, errors, bandwidthKiBps, activeThreads };
}

export interface BlazeMeterSummaryApiRow {
  avg?: number;
  hits?: number;
  tp90?: number;
  min?: number;
  max?: number;
  bytes?: number;
  failed?: number;
  concurrency?: number;
  duration?: number;
  id?: string;
  lb?: string;
}

export async function fetchMasterApiSummary(masterId: string | number) {
  try {
    const data = await blazeMeterRequest<{
      summary?: BlazeMeterSummaryApiRow[];
      maxUsers?: number;
    }>(`/masters/${masterId}/reports/default/summary`);
    const row =
      data.result?.summary?.find((s) => s.id === "ALL" || s.lb === "ALL") ??
      data.result?.summary?.[0];
    if (!row) return null;
    return {
      avgResponseTimeMs: row.avg ?? 0,
      hitsPerSec: row.hits ?? 0,
      tp90Ms: row.tp90 ?? 0,
      minMs: row.min ?? 0,
      maxMs: row.max ?? 0,
      totalBytes: row.bytes ?? 0,
      failedCount: row.failed ?? 0,
      concurrency: row.concurrency ?? data.result?.maxUsers ?? 0,
      durationSec: row.duration ?? 0,
    };
  } catch {
    return null;
  }
}
