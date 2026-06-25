"use client";

import { useState } from "react";
import { FolderOpen, Loader2 } from "lucide-react";

export function FolderPicker({
  value,
  onChange,
  error,
  onBrowse,
}: {
  value: string;
  onChange: (path: string) => void;
  error?: string;
  onBrowse?: () => Promise<string | null>;
}) {
  const [browsing, setBrowsing] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);

  async function handleBrowse() {
    if (!onBrowse) {
      setBrowseError("Connect the Local Executor to browse folders.");
      return;
    }
    setBrowseError(null);
    setBrowsing(true);
    try {
      const picked = await onBrowse();
      if (picked) onChange(picked);
    } catch (e) {
      setBrowseError(e instanceof Error ? e.message : "Could not pick folder");
    } finally {
      setBrowsing(false);
    }
  }

  return (
    <div>
      <label className="text-sm font-medium text-slate-700">
        Project location
      </label>
      <div className="mt-1 flex gap-2">
        <input
          className="input min-w-0 flex-1"
          placeholder="D:\Projects"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="btn-secondary inline-flex shrink-0 items-center gap-1"
          onClick={handleBrowse}
          disabled={browsing}
        >
          {browsing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FolderOpen className="h-4 w-4" />
          )}
          Browse
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Browse opens a folder picker on your PC via the Local Executor. You can
        also type a path manually.
      </p>
      {browseError ? (
        <p className="mt-1 text-xs text-red-600">{browseError}</p>
      ) : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function ConfigSectionCards({
  config,
  onChange,
  showFrontend,
  showBackend,
  fieldErrors = {},
  onBrowseFolder,
}: {
  config: import("@/lib/project-setup/types").ProjectSetupConfig;
  onChange: (partial: Partial<typeof config>) => void;
  showFrontend: boolean;
  showBackend: boolean;
  fieldErrors?: Record<string, string>;
  onBrowseFolder?: () => Promise<string | null>;
}) {
  return (
    <div className="space-y-4">
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">Project details</h3>
        <Field label="Project name">
          <input
            className="input w-full"
            value={config.projectName}
            onChange={(e) => onChange({ projectName: e.target.value })}
            placeholder="MyNewApp"
            aria-invalid={Boolean(fieldErrors.projectName)}
          />
          {fieldErrors.projectName ? (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.projectName}
            </p>
          ) : null}
        </Field>
        <Field label="Description">
          <textarea
            className="input min-h-[80px] w-full"
            value={config.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </Field>
        <FolderPicker
          value={config.locationPath}
          onChange={(locationPath) => onChange({ locationPath })}
          error={fieldErrors.locationPath}
          onBrowse={onBrowseFolder}
        />
      </div>

      {showFrontend ? (
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-900">Frontend</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Framework">
              <select
                className="input w-full"
                value={config.frontendFramework}
                onChange={(e) =>
                  onChange({
                    frontendFramework: e.target
                      .value as typeof config.frontendFramework,
                  })
                }
              >
                <option value="nextjs">Next.js</option>
                <option value="react">React (Vite)</option>
              </select>
            </Field>
            <Field label="Styling">
              <select
                className="input w-full"
                value={config.styling}
                onChange={(e) =>
                  onChange({ styling: e.target.value as typeof config.styling })
                }
              >
                <option value="tailwind">Tailwind CSS</option>
                <option value="mui">Material UI</option>
                <option value="shadcn">ShadCN UI</option>
              </select>
            </Field>
            <Field label="State management">
              <select
                className="input w-full"
                value={config.stateManagement}
                onChange={(e) =>
                  onChange({
                    stateManagement: e.target
                      .value as typeof config.stateManagement,
                  })
                }
              >
                <option value="redux">Redux Toolkit</option>
                <option value="zustand">Zustand</option>
                <option value="context">Context API</option>
              </select>
            </Field>
            <Field label="Authentication">
              <select
                className="input w-full"
                value={config.frontendAuth}
                onChange={(e) =>
                  onChange({
                    frontendAuth: e.target.value as typeof config.frontendAuth,
                  })
                }
              >
                <option value="none">None</option>
                <option value="jwt">JWT</option>
                <option value="google_oauth">Google OAuth</option>
              </select>
            </Field>
          </div>
        </div>
      ) : null}

      {showBackend ? (
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-slate-900">Backend & database</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Authentication">
              <select
                className="input w-full"
                value={config.backendAuth}
                onChange={(e) =>
                  onChange({
                    backendAuth: e.target.value as typeof config.backendAuth,
                  })
                }
              >
                <option value="jwt">JWT</option>
                <option value="google_oauth">Google OAuth</option>
              </select>
            </Field>
            <Field label="Database">
              <select
                className="input w-full"
                value={config.database}
                onChange={(e) =>
                  onChange({
                    database: e.target.value as typeof config.database,
                  })
                }
              >
                <option value="mongodb">MongoDB</option>
                <option value="postgresql">PostgreSQL</option>
              </select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {(
              [
                ["swagger", "Swagger"],
                ["redis", "Redis"],
                ["socketIo", "Socket.IO"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config[key]}
                  onChange={(e) => onChange({ [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">DevOps</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.docker}
              onChange={(e) => onChange({ docker: e.target.checked })}
            />
            Docker
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.githubActions}
              onChange={(e) => onChange({ githubActions: e.target.checked })}
            />
            GitHub Actions
          </label>
        </div>
        <Field label="Deployment target">
          <select
            className="input w-full"
            value={config.deploymentTarget}
            onChange={(e) =>
              onChange({
                deploymentTarget: e.target
                  .value as typeof config.deploymentTarget,
              })
            }
          >
            <option value="none">None</option>
            <option value="railway">Railway</option>
            <option value="render">Render</option>
            <option value="vercel">Vercel</option>
          </select>
        </Field>
      </div>
    </div>
  );
}
