"use client";

import { useState } from "react";
import { FolderOpen, Loader2 } from "lucide-react";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { StyledCheckboxGroup } from "@/components/ui/StyledCheckbox";
import type { ProjectSetupConfig } from "@/lib/project-setup/types";

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
    <div className="field-group">
      <label className="field-label">Project location</label>
      <div className="flex gap-2">
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
      <p className="field-hint">
        Browse opens a folder picker on your PC via the Local Executor. You can
        also type a path manually.
      </p>
      {browsing ? (
        <p className="rounded-xl border border-brand-200/80 bg-brand-50/80 px-3 py-2 text-xs text-brand-800 backdrop-blur-sm">
          Opening folder picker on your PC…
        </p>
      ) : null}
      {browseError ? (
        <p className="text-xs text-red-600">{browseError}</p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      {children}
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

function CheckboxGroup({
  items,
  config,
  onChange,
}: {
  items: { key: keyof ProjectSetupConfig; label: string }[];
  config: ProjectSetupConfig;
  onChange: (partial: Partial<ProjectSetupConfig>) => void;
}) {
  const values = Object.fromEntries(
    items.map(({ key }) => [key, Boolean(config[key])]),
  ) as Record<(typeof items)[number]["key"], boolean>;

  return (
    <StyledCheckboxGroup
      items={items}
      values={values}
      onChange={(key, checked) => onChange({ [key]: checked })}
    />
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
  config: ProjectSetupConfig;
  onChange: (partial: Partial<typeof config>) => void;
  showFrontend: boolean;
  showBackend: boolean;
  fieldErrors?: Record<string, string>;
  onBrowseFolder?: () => Promise<string | null>;
}) {
  return (
    <div className="space-y-5">
      <div className="card space-y-5 p-5 sm:p-6">
        <h3 className="section-card-title">Project details</h3>
        <Field label="Project name">
          <input
            className="input w-full"
            value={config.projectName}
            onChange={(e) => onChange({ projectName: e.target.value })}
            placeholder="MyNewApp"
            aria-invalid={Boolean(fieldErrors.projectName)}
          />
          {fieldErrors.projectName ? (
            <p className="text-xs text-red-600">{fieldErrors.projectName}</p>
          ) : null}
        </Field>
        <Field label="Description">
          <textarea
            className="input min-h-[88px] w-full resize-y"
            value={config.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Brief description of your project…"
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
        <div className="card space-y-5 p-5 sm:p-6">
          <h3 className="section-card-title">Frontend</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Framework">
              <StyledSelect
                value={config.frontendFramework}
                onChange={(frontendFramework) =>
                  onChange({ frontendFramework })
                }
                options={[
                  { value: "nextjs", label: "Next.js" },
                  { value: "react", label: "React (Vite)" },
                ]}
              />
            </Field>
            <Field label="Styling">
              <StyledSelect
                value={config.styling}
                onChange={(styling) => onChange({ styling })}
                options={[
                  { value: "tailwind", label: "Tailwind CSS" },
                  { value: "mui", label: "Material UI" },
                  { value: "shadcn", label: "ShadCN UI" },
                ]}
              />
            </Field>
            <Field label="State management">
              <StyledSelect
                value={config.stateManagement}
                onChange={(stateManagement) => onChange({ stateManagement })}
                options={[
                  { value: "redux", label: "Redux Toolkit" },
                  { value: "zustand", label: "Zustand" },
                  { value: "context", label: "Context API" },
                ]}
              />
            </Field>
            <Field label="Authentication">
              <StyledSelect
                value={config.frontendAuth}
                onChange={(frontendAuth) => onChange({ frontendAuth })}
                options={[
                  { value: "none", label: "None" },
                  { value: "jwt", label: "JWT" },
                  { value: "google_oauth", label: "Google OAuth" },
                ]}
              />
            </Field>
            {config.frontendAuth === "jwt" && !showBackend ? (
              <Field
                label="JWT secret (optional)"
                hint="Used by the frontend for auth. Same value as the backend JWT secret in full-stack apps."
              >
                <input
                  className="input w-full font-mono text-sm"
                  type="password"
                  value={config.jwtSecret}
                  onChange={(e) => onChange({ jwtSecret: e.target.value })}
                  placeholder="Leave blank to set manually after setup"
                  autoComplete="new-password"
                />
              </Field>
            ) : null}
          </div>
        </div>
      ) : null}

      {showBackend ? (
        <div className="card space-y-5 p-5 sm:p-6">
          <h3 className="section-card-title">Backend & database</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Framework">
              <StyledSelect
                value={config.backendFramework}
                onChange={(backendFramework) => onChange({ backendFramework })}
                options={[
                  { value: "express", label: "Express.js" },
                  { value: "nestjs", label: "NestJS" },
                ]}
              />
            </Field>
            <Field label="Authentication">
              <StyledSelect
                value={config.backendAuth}
                onChange={(backendAuth) => onChange({ backendAuth })}
                options={[
                  { value: "jwt", label: "JWT" },
                  { value: "google_oauth", label: "Google OAuth" },
                ]}
              />
            </Field>
            <Field label="Database">
              <StyledSelect
                value={config.database}
                onChange={(database) => onChange({ database })}
                options={[
                  { value: "mongodb", label: "MongoDB" },
                  { value: "postgresql", label: "PostgreSQL" },
                ]}
              />
            </Field>
          </div>
          {config.database === "postgresql" ? (
            <>
              <Field
                label="DATABASE_URL (optional)"
                hint="Written to .env when provided. Required if you run migrations during setup."
              >
                <input
                  className="input w-full font-mono text-sm"
                  value={config.databaseUrl}
                  onChange={(e) => onChange({ databaseUrl: e.target.value })}
                  placeholder="postgresql://postgres:password@localhost:5432/mydb"
                  aria-invalid={Boolean(fieldErrors.databaseUrl)}
                />
                {fieldErrors.databaseUrl ? (
                  <p className="text-xs text-red-600">
                    {fieldErrors.databaseUrl}
                  </p>
                ) : null}
              </Field>
              <CheckboxGroup
                config={config}
                onChange={onChange}
                items={[
                  {
                    key: "runMigrations",
                    label: "Run migration during setup",
                  },
                ]}
              />
            </>
          ) : null}
          {config.backendAuth === "jwt" ? (
            <Field
              label="JWT secret (optional)"
              hint="Written to .env for the backend. Generate a long random string for production."
            >
              <input
                className="input w-full font-mono text-sm"
                type="password"
                value={config.jwtSecret}
                onChange={(e) => onChange({ jwtSecret: e.target.value })}
                placeholder="Leave blank to set manually after setup"
                autoComplete="new-password"
              />
            </Field>
          ) : null}
          <CheckboxGroup
            config={config}
            onChange={onChange}
            items={[
              { key: "swagger", label: "Swagger" },
              { key: "redis", label: "Redis" },
              { key: "socketIo", label: "Socket.IO" },
            ]}
          />
          {config.backendFramework === "nestjs" ? (
            <p className="text-xs text-slate-500">
              Swagger, Redis, and Socket.IO scaffolding is currently available
              for Express.js projects only. NestJS includes modular auth, users,
              and database layers when JWT and a database are selected.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="card space-y-5 p-5 sm:p-6">
        <h3 className="section-card-title">DevOps</h3>
        <CheckboxGroup
          config={config}
          onChange={onChange}
          items={[
            { key: "docker", label: "Docker" },
            { key: "githubActions", label: "GitHub Actions" },
          ]}
        />
        <Field label="Deployment target">
          <StyledSelect
            value={config.deploymentTarget}
            onChange={(deploymentTarget) => onChange({ deploymentTarget })}
            options={[
              { value: "none", label: "None" },
              { value: "railway", label: "Railway" },
              { value: "render", label: "Render" },
              { value: "vercel", label: "Vercel" },
            ]}
          />
        </Field>
      </div>
    </div>
  );
}
