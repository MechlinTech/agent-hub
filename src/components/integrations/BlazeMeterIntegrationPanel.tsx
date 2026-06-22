"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Pencil, RefreshCw, X } from "lucide-react";
import { BlazeMeterIcon } from "@/components/integrations/BlazeMeterIcon";
import type {
  BlazeMeterNamedEntity,
  BlazeMeterOrgConfig,
  BlazeMeterPublicStatus,
  BlazeMeterTestProvisioningMode,
} from "@/lib/blazemeter/types";
import { hasBlazeMeterWorkspaceConfig } from "@/lib/blazemeter/types";
import { buildBlazeMeterSavePayload } from "@/lib/blazemeter/types";

interface PerformanceTestOption extends BlazeMeterNamedEntity {
  filename: string | null;
}

function configsEqual(a: BlazeMeterOrgConfig, b: BlazeMeterOrgConfig): boolean {
  const stripSecret = (config: BlazeMeterOrgConfig) => ({ ...config, apiKeySecret: null });
  return JSON.stringify(stripSecret(a)) === JSON.stringify(stripSecret(b));
}

function isConfigSaved(config: BlazeMeterOrgConfig): boolean {
  return hasBlazeMeterWorkspaceConfig(config);
}

function provisioningLabel(mode: BlazeMeterTestProvisioningMode): string {
  return mode === "reuse_existing"
    ? "Reuse an existing BlazeMeter test"
    : "Create a new test for each review";
}

export function BlazeMeterIntegrationPanel({
  onStatusChange,
}: {
  onStatusChange?: (connected: boolean) => void;
}) {
  const [status, setStatus] = useState<BlazeMeterPublicStatus | null>(null);
  const [savedConfig, setSavedConfig] = useState<BlazeMeterOrgConfig | null>(null);
  const [config, setConfig] = useState<BlazeMeterOrgConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [accounts, setAccounts] = useState<BlazeMeterNamedEntity[]>([]);
  const [workspaces, setWorkspaces] = useState<BlazeMeterNamedEntity[]>([]);
  const [projects, setProjects] = useState<BlazeMeterNamedEntity[]>([]);
  const [tests, setTests] = useState<PerformanceTestOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyServerState = useCallback(
    (data: BlazeMeterPublicStatus) => {
      setStatus(data);
      const clientConfig = { ...data.config, apiKeySecret: "" };
      setSavedConfig(clientConfig);
      setConfig(clientConfig);
      setIsEditing(!isConfigSaved(data.config));
      onStatusChange?.(data.connected);
    },
    [onStatusChange]
  );

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/blazemeter");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load BlazeMeter settings");
      applyServerState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load BlazeMeter settings");
    } finally {
      setLoading(false);
    }
  }, [applyServerState]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!config || !status?.credentialsConfigured) return;
    const saved = config;

    async function hydrateSavedSelections() {
      try {
        if (saved.accountId) {
          const accountsRes = await fetch("/api/integrations/blazemeter/accounts");
          const accountsData = await accountsRes.json();
          if (accountsRes.ok) setAccounts(accountsData.items ?? []);

          const workspacesRes = await fetch(
            `/api/integrations/blazemeter/workspaces?accountId=${saved.accountId}`
          );
          const workspacesData = await workspacesRes.json();
          if (workspacesRes.ok) setWorkspaces(workspacesData.items ?? []);
        }

        if (saved.workspaceId) {
          const projectsRes = await fetch(
            `/api/integrations/blazemeter/projects?workspaceId=${saved.workspaceId}`
          );
          const projectsData = await projectsRes.json();
          if (projectsRes.ok) setProjects(projectsData.items ?? []);
        }

        if (saved.projectId && saved.workspaceId) {
          const params = new URLSearchParams({
            projectId: String(saved.projectId),
            workspaceId: String(saved.workspaceId),
          });
          const testsRes = await fetch(`/api/integrations/blazemeter/tests?${params.toString()}`);
          const testsData = await testsRes.json();
          if (testsRes.ok) setTests(testsData.items ?? []);
        }
      } catch {
        // Saved IDs still render via fallback options if API hydration fails.
      }
    }

    void hydrateSavedSelections();
  }, [config, status?.credentialsConfigured]);

  async function loadAccounts() {
    if (!config || !canUseCredentialsFromConfig(config, status?.credentialsConfigured ?? false)) {
      setError("Enter and save API credentials first, or use Fetch details.");
      return;
    }
    setLoadingAccounts(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/blazemeter/accounts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load accounts");
      setAccounts(data.items ?? []);
      if (!data.items?.length) {
        setError("No BlazeMeter accounts returned for this API key.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function loadWorkspaces(accountId = config?.accountId) {
    if (!accountId) {
      setError("Select an account first (click Load accounts).");
      return;
    }
    setLoadingWorkspaces(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/integrations/blazemeter/workspaces?accountId=${accountId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load workspaces");
      setWorkspaces(data.items ?? []);
      if (!data.items?.length) {
        setError("No workspaces found for this account. Check the Account ID or API key permissions.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces");
    } finally {
      setLoadingWorkspaces(false);
    }
  }

  async function loadProjects(workspaceId: number) {
    setLoadingProjects(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/integrations/blazemeter/projects?workspaceId=${workspaceId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load projects");
      setProjects(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  }

  async function loadTests(projectId: number, workspaceId: number) {
    setLoadingTests(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        projectId: String(projectId),
        workspaceId: String(workspaceId),
      });
      const res = await fetch(`/api/integrations/blazemeter/tests?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load tests");
      setTests(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tests");
    } finally {
      setLoadingTests(false);
    }
  }

  function updateConfig(patch: Partial<BlazeMeterOrgConfig>) {
    setConfig((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function startEditing() {
    if (savedConfig) setConfig({ ...savedConfig });
    setIsEditing(true);
    setMessage(null);
    setError(null);
  }

  function cancelEditing() {
    if (savedConfig) setConfig({ ...savedConfig });
    setIsEditing(savedConfig ? !isConfigSaved(savedConfig) : true);
    setMessage(null);
    setError(null);
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/integrations/blazemeter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBlazeMeterSavePayload(config)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save settings");
      applyServerState(data);
      setIsEditing(!isConfigSaved(data.config));
      setMessage(
        data.connected
          ? "BlazeMeter settings saved."
          : "BlazeMeter settings saved. Use Test connection to verify access."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    if (!config) return;
    setTesting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/integrations/blazemeter/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBlazeMeterSavePayload({ ...config, enabled: true })),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Connection test failed");
      applyServerState(data);
      setIsEditing(false);
      setMessage("Connection successful. BlazeMeter is ready.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection test failed");
    } finally {
      setTesting(false);
    }
  }

  async function handleFetchDetails() {
    if (!config) return;
    if (!canUseCredentialsFromConfig(config, credentialsConfigured)) {
      setError("Enter your API Key ID and Secret before fetching details.");
      return;
    }

    setFetchingDetails(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/integrations/blazemeter/fetch-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKeyId: config.apiKeyId,
          apiKeySecret: config.apiKeySecret || undefined,
          accountId: config.accountId,
          workspaceId: config.workspaceId,
          projectId: config.projectId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch BlazeMeter details");

      setAccounts(data.accounts ?? []);
      setWorkspaces(data.workspaces ?? []);
      setProjects(data.projects ?? []);
      setTests(data.tests ?? []);

      if (data.config) {
        const clientConfig = { ...data.config, apiKeySecret: "" };
        setSavedConfig(clientConfig);
        setConfig((prev) =>
          prev
            ? {
                ...clientConfig,
                apiKeySecret: prev.apiKeySecret || "",
              }
            : clientConfig
        );
      }

      setStatus((prev) =>
        prev
          ? {
              ...prev,
              credentialsConfigured: true,
              connected: Boolean(data.config?.lastValidatedAt),
              config: data.config ?? prev.config,
            }
          : prev
      );

      const accountCount = data.accounts?.length ?? 0;
      const workspaceCount = data.workspaces?.length ?? 0;
      const projectCount = data.projects?.length ?? 0;
      setMessage(
        `Fetched ${accountCount} account(s), ${workspaceCount} workspace(s), and ${projectCount} project(s). Select the values you need, then save settings.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch BlazeMeter details");
    } finally {
      setFetchingDetails(false);
    }
  }

  if (loading || !config || !status || !savedConfig) {
    return (
      <div className="card flex items-center gap-2 p-6 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading BlazeMeter integration…
      </div>
    );
  }

  const connected = status.connected;
  const credentialsConfigured = status.credentialsConfigured;
  const canUseCredentials = canUseCredentialsFromConfig(config, credentialsConfigured);
  const showViewMode = !isEditing && isConfigSaved(savedConfig);
  const hasUnsavedChanges = !configsEqual(config, savedConfig);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div>
          <div className="flex items-center gap-2">
            <BlazeMeterIcon size={22} />
            <h2 className="text-lg font-semibold text-slate-900">BlazeMeter</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Configure your BlazeMeter API credentials, workspace, project, and test provisioning
            behavior here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {connected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Connected
            </span>
          ) : credentialsConfigured ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
              Configured, not validated
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
              API key missing
            </span>
          )}
          {showViewMode && (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit configuration
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6 px-6 py-5">
        {showViewMode ? (
          <SavedConfigurationView
            config={savedConfig}
            connected={connected}
            credentialsConfigured={credentialsConfigured}
          />
        ) : (
          <ConfigurationForm
            config={config}
            credentialsConfigured={credentialsConfigured}
            accounts={accounts}
            workspaces={workspaces}
            projects={projects}
            tests={tests}
            loadingAccounts={loadingAccounts}
            loadingWorkspaces={loadingWorkspaces}
            loadingProjects={loadingProjects}
            loadingTests={loadingTests}
            fetchingDetails={fetchingDetails}
            canUseCredentials={canUseCredentials}
            onUpdate={updateConfig}
            onFetchDetails={handleFetchDetails}
            onLoadAccounts={loadAccounts}
            onLoadWorkspaces={() => loadWorkspaces()}
            onLoadProjects={(id) => loadProjects(id)}
            onLoadTests={(projectId, workspaceId) => loadTests(projectId, workspaceId)}
            onClearWorkspaces={() => setWorkspaces([])}
            onClearProjects={() => setProjects([])}
            onClearTests={() => setTests([])}
          />
        )}

        {savedConfig.lastValidatedAt && (
          <p className="text-xs text-slate-500">
            Last validated: {new Date(savedConfig.lastValidatedAt).toLocaleString()}
          </p>
        )}

        {message && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {!showViewMode && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
            {isConfigSaved(savedConfig) && (
              <button
                type="button"
                onClick={cancelEditing}
                className="btn-secondary inline-flex items-center gap-1.5"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !canUseCredentials}
              className="btn-secondary disabled:opacity-60"
            >
              {testing ? "Testing…" : "Test connection"}
            </button>
          </div>
        )}

        {showViewMode && credentialsConfigured && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="btn-secondary disabled:opacity-60"
            >
              {testing ? "Testing…" : "Re-test connection"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SavedConfigurationView({
  config,
  connected,
  credentialsConfigured,
}: {
  config: BlazeMeterOrgConfig;
  connected: boolean;
  credentialsConfigured: boolean;
}) {
  const rows = [
    {
      label: "API Key ID",
      value: config.apiKeyId ? config.apiKeyId : "—",
    },
    {
      label: "API Key Secret",
      value: credentialsConfigured ? "Configured" : "—",
    },
    { label: "Status", value: config.enabled ? "Enabled" : "Disabled" },
    {
      label: "Account",
      value: config.accountName
        ? `${config.accountName} (${config.accountId})`
        : config.accountId
          ? String(config.accountId)
          : "-",
    },
    {
      label: "Workspace",
      value: config.workspaceName
        ? `${config.workspaceName} (${config.workspaceId})`
        : config.workspaceId
          ? String(config.workspaceId)
          : "-",
    },
    {
      label: "Project",
      value: config.projectName
        ? `${config.projectName} (${config.projectId})`
        : config.projectId
          ? String(config.projectId)
          : "-",
    },
    { label: "Default location", value: config.defaultLocation },
    { label: "Test provisioning", value: provisioningLabel(config.testProvisioningMode) },
  ];

  if (config.testProvisioningMode === "reuse_existing" && config.reuseTestId) {
    rows.push({
      label: "Reuse test",
      value: config.reuseTestName
        ? `${config.reuseTestName} (${config.reuseTestId})`
        : String(config.reuseTestId),
    });
  }

  return (
    <div className="rounded-lg border border-green-200 bg-green-50/40 p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-green-800">
        <CheckCircle2 className="h-4 w-4" />
        {connected ? "Integration saved and connected" : "Integration saved"}
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {row.label}
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-slate-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function canUseCredentialsFromConfig(
  config: BlazeMeterOrgConfig,
  credentialsConfigured: boolean
): boolean {
  return (
    credentialsConfigured || Boolean(config.apiKeyId?.trim() && config.apiKeySecret?.trim())
  );
}

function ConfigurationForm({
  config,
  credentialsConfigured,
  accounts,
  workspaces,
  projects,
  tests,
  loadingAccounts,
  loadingWorkspaces,
  loadingProjects,
  loadingTests,
  fetchingDetails,
  canUseCredentials,
  onUpdate,
  onFetchDetails,
  onLoadAccounts,
  onLoadWorkspaces,
  onLoadProjects,
  onLoadTests,
  onClearWorkspaces,
  onClearProjects,
  onClearTests,
}: {
  config: BlazeMeterOrgConfig;
  credentialsConfigured: boolean;
  accounts: BlazeMeterNamedEntity[];
  workspaces: BlazeMeterNamedEntity[];
  projects: BlazeMeterNamedEntity[];
  tests: PerformanceTestOption[];
  loadingAccounts: boolean;
  loadingWorkspaces: boolean;
  loadingProjects: boolean;
  loadingTests: boolean;
  fetchingDetails: boolean;
  canUseCredentials: boolean;
  onUpdate: (patch: Partial<BlazeMeterOrgConfig>) => void;
  onFetchDetails: () => void;
  onLoadAccounts: () => void;
  onLoadWorkspaces: () => void;
  onLoadProjects: (workspaceId: number) => void;
  onLoadTests: (projectId: number, workspaceId: number) => void;
  onClearWorkspaces: () => void;
  onClearProjects: () => void;
  onClearTests: () => void;
}) {
  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">API credentials</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">API Key ID</span>
            <input
              type="text"
              value={config.apiKeyId ?? ""}
              onChange={(e) => onUpdate({ apiKeyId: e.target.value || null })}
              className="input w-full font-mono text-sm"
              placeholder="Your BlazeMeter API key ID"
              autoComplete="off"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">API Key Secret</span>
            <input
              type="password"
              value={config.apiKeySecret ?? ""}
              onChange={(e) => onUpdate({ apiKeySecret: e.target.value || null })}
              className="input w-full font-mono text-sm"
              placeholder={
                credentialsConfigured
                  ? "Leave blank to keep existing secret"
                  : "Your BlazeMeter API key secret"
              }
              autoComplete="new-password"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onFetchDetails}
            disabled={fetchingDetails || !canUseCredentials}
            className="btn-secondary inline-flex items-center gap-2 disabled:opacity-60"
          >
            {fetchingDetails ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {fetchingDetails ? "Fetching details…" : "Fetch details"}
          </button>
          <p className="text-xs text-slate-500">
            Saves your API credentials and loads accounts, workspaces, and projects into the
            dropdowns below.
          </p>
        </div>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => onUpdate({ enabled: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300"
        />
        <span className="text-sm font-medium text-slate-800">Enable BlazeMeter integration</span>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Account</span>
            <button
              type="button"
              onClick={onLoadAccounts}
              disabled={loadingAccounts || !canUseCredentials}
              title={canUseCredentials ? undefined : "Enter API credentials first"}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 disabled:opacity-50"
            >
              {loadingAccounts ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Load accounts
            </button>
          </div>
          <select
            value={config.accountId ?? ""}
            onChange={(e) => {
              const accountId = e.target.value ? Number(e.target.value) : null;
              const selected = accounts.find((a) => a.id === accountId);
              onUpdate({
                accountId,
                accountName: selected?.name ?? null,
                workspaceId: null,
                workspaceName: null,
                projectId: null,
                projectName: null,
                reuseTestId: null,
                reuseTestName: null,
              });
              onClearWorkspaces();
              onClearProjects();
              onClearTests();
              if (accountId) onLoadWorkspaces();
            }}
            disabled={!canUseCredentials}
            className="input w-full disabled:bg-slate-50"
          >
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.id})
              </option>
            ))}
            {config.accountId && !accounts.some((a) => a.id === config.accountId) && (
              <option value={config.accountId}>
                {config.accountName || `Account ${config.accountId}`} ({config.accountId})
              </option>
            )}
          </select>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Default cloud location</span>
          <input
            type="text"
            value={config.defaultLocation}
            onChange={(e) => onUpdate({ defaultLocation: e.target.value })}
            className="input w-full"
            placeholder="us-east-1"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Workspace</span>
            <button
              type="button"
              onClick={onLoadWorkspaces}
              disabled={loadingWorkspaces || !config.accountId}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 disabled:opacity-50"
            >
              {loadingWorkspaces ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Load
            </button>
          </div>
          <select
            value={config.workspaceId ?? ""}
            onChange={(e) => {
              const workspaceId = e.target.value ? Number(e.target.value) : null;
              const selected = workspaces.find((w) => w.id === workspaceId);
              onUpdate({
                workspaceId,
                workspaceName: selected?.name ?? null,
                projectId: null,
                projectName: null,
                reuseTestId: null,
                reuseTestName: null,
              });
              onClearProjects();
              onClearTests();
              if (workspaceId) onLoadProjects(workspaceId);
            }}
            className="input w-full"
          >
            <option value="">Select workspace</option>
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.id})
              </option>
            ))}
            {config.workspaceId && !workspaces.some((w) => w.id === config.workspaceId) && (
              <option value={config.workspaceId}>
                {config.workspaceName || `Workspace ${config.workspaceId}`} ({config.workspaceId})
              </option>
            )}
          </select>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Project</span>
            {config.workspaceId ? (
              <button
                type="button"
                onClick={() => config.workspaceId && onLoadProjects(config.workspaceId)}
                disabled={loadingProjects}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 disabled:opacity-50"
              >
                {loadingProjects ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Refresh
              </button>
            ) : null}
          </div>
          <select
            value={config.projectId ?? ""}
            onChange={(e) => {
              const projectId = e.target.value ? Number(e.target.value) : null;
              const selected = projects.find((p) => p.id === projectId);
              onUpdate({
                projectId,
                projectName: selected?.name ?? null,
                reuseTestId: null,
                reuseTestName: null,
              });
              onClearTests();
              if (projectId && config.workspaceId) {
                onLoadTests(projectId, config.workspaceId);
              }
            }}
            disabled={!config.workspaceId}
            className="input w-full disabled:bg-slate-50"
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id})
              </option>
            ))}
            {config.projectId && !projects.some((p) => p.id === config.projectId) && (
              <option value={config.projectId}>
                {config.projectName || `Project ${config.projectId}`} ({config.projectId})
              </option>
            )}
          </select>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-slate-700">Test provisioning</legend>
        {(
          [
            {
              value: "create_per_review" as BlazeMeterTestProvisioningMode,
              title: "Create a new test for each review",
              description:
                "Each script review run uploads JMX assets to a freshly created BlazeMeter test.",
            },
            {
              value: "reuse_existing" as BlazeMeterTestProvisioningMode,
              title: "Reuse an existing BlazeMeter test",
              description:
                "Upload reviewed scripts into a selected test ID before starting a run.",
            },
          ] as const
        ).map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${
              config.testProvisioningMode === option.value
                ? "border-brand-500 bg-brand-50"
                : "border-slate-200"
            }`}
          >
            <input
              type="radio"
              name="testProvisioningMode"
              checked={config.testProvisioningMode === option.value}
              onChange={() =>
                onUpdate({
                  testProvisioningMode: option.value,
                  reuseTestId: option.value === "reuse_existing" ? config.reuseTestId : null,
                  reuseTestName: option.value === "reuse_existing" ? config.reuseTestName : null,
                })
              }
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-slate-900">{option.title}</span>
              <span className="mt-0.5 block text-sm text-slate-500">{option.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {config.testProvisioningMode === "reuse_existing" && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Existing test to reuse</span>
            {config.projectId && config.workspaceId ? (
              <button
                type="button"
                onClick={() =>
                  config.projectId &&
                  config.workspaceId &&
                  onLoadTests(config.projectId, config.workspaceId)
                }
                disabled={loadingTests}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 disabled:opacity-50"
              >
                {loadingTests ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Load tests
              </button>
            ) : null}
          </div>
          <select
            value={config.reuseTestId ?? ""}
            onChange={(e) => {
              const selected = tests.find((t) => t.id === Number(e.target.value));
              onUpdate({
                reuseTestId: e.target.value ? Number(e.target.value) : null,
                reuseTestName: selected?.name ?? null,
              });
            }}
            disabled={!config.projectId || !config.workspaceId}
            className="input w-full disabled:bg-slate-50"
          >
            <option value="">Select performance test</option>
            {tests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.id})
                {t.filename ? `: ${t.filename}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
