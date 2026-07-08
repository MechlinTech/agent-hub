"use client";

import { PermissionLink } from "@/components/permissions/PermissionLink";
import { StyledCheckbox } from "@/components/ui/StyledCheckbox";
import { useEffect, useState } from "react";
import { usePermissions } from "@/lib/permissions-context";
import { createClient } from "@/lib/supabase/client";
import type { AiRecommendationMode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProviderStatus {
  id: string;
  label: string;
  configured: boolean;
  model: string;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

function AiModeOption({
  name,
  checked,
  disabled,
  onChange,
  title,
  description,
}: {
  name: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all duration-200",
        checked
          ? "border-brand-500/50 bg-brand-50/80 ring-1 ring-brand-500/20"
          : "glass-surface hover:border-slate-300/90",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-1 h-4 w-4 shrink-0 border-slate-300 text-brand-600 focus:ring-brand-500/30"
      />
      <div className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
      </div>
    </label>
  );
}

export default function SettingsPage() {
  const { canWrite } = usePermissions();
  const canEdit = canWrite("settings");
  const [aiMode, setAiMode] = useState<AiRecommendationMode>("disabled");
  const [useTemplates, setUseTemplates] = useState(true);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [fullName, setFullName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: settings }, { data: profile }, aiRes] = await Promise.all([
        supabase
          .from("user_settings")
          .select("ai_recommendation_mode, use_builtin_templates")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("profiles")
          .select("full_name, team_name")
          .eq("id", user.id)
          .single(),
        fetch("/api/ai/status"),
      ]);

      if (settings) {
        setAiMode(settings.ai_recommendation_mode as AiRecommendationMode);
        setUseTemplates(settings.use_builtin_templates ?? true);
      }
      if (profile) {
        setFullName(profile.full_name ?? "");
        setTeamName(profile.team_name ?? "");
      }
      if (aiRes.ok) {
        const ai = await aiRes.json();
        setAiAvailable(ai.configured);
        setActiveProvider(ai.provider);
        setActiveModel(ai.model);
        setProviders(ai.providers ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function save() {
    if (!canEdit) return;
    setError(null);
    if (aiMode === "enabled" && !aiAvailable) {
      setError(
        "Cannot enable AI mode. Set at least one of OPENAI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY in .env.local and restart the dev server.",
      );
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: settingsError } = await supabase
      .from("user_settings")
      .upsert({
        user_id: user.id,
        ai_recommendation_mode: aiMode,
        use_builtin_templates: useTemplates,
        updated_at: new Date().toISOString(),
      });

    if (settingsError) {
      setError(settingsError.message);
      return;
    }

    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      team_name: teamName,
      updated_at: new Date().toISOString(),
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const activeLabel =
    providers.find((p) => p.id === activeProvider)?.label ??
    activeProvider ??
    "Unknown";

  return (
    <div className="w-full space-y-5">
      {!canEdit && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-800">
          You have read-only access to profile settings.
        </div>
      )}

      <div className="card space-y-5 p-5 sm:p-6">
        <h2 className="section-card-title">Profile</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full Name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={!canEdit}
              className="input w-full disabled:cursor-not-allowed disabled:opacity-60"
            />
          </Field>
          <Field label="Team">
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={!canEdit}
              className="input w-full disabled:cursor-not-allowed disabled:opacity-60"
            />
          </Field>
        </div>
      </div>

      <div className="card space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="section-card-title">AI Recommendation Mode</h2>
          <p className="field-hint mt-3">
            Rules detect issues; AI enhances impact text and recommendations when
            enabled.
          </p>
        </div>

        <div className="glass-surface rounded-2xl p-4 sm:p-5">
          <p className="text-sm text-slate-700">
            Active provider:{" "}
            {aiAvailable ? (
              <span className="font-semibold text-emerald-700">
                {activeLabel} ({activeModel})
              </span>
            ) : (
              <span className="font-semibold text-amber-700">None configured</span>
            )}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {providers.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-2 first:border-t-0 first:pt-0"
              >
                <span>{p.label}</span>
                <span
                  className={cn(
                    "font-medium",
                    p.configured ? "text-emerald-700" : "text-slate-400",
                  )}
                >
                  {p.configured ? `Ready · ${p.model}` : "Not configured"}
                </span>
              </li>
            ))}
          </ul>
          {!aiAvailable && (
            <p className="mt-3 text-xs leading-relaxed text-amber-700">
              Add a real API key to{" "}
              <code className="rounded bg-white/80 px-1 py-0.5">.env.local</code> (not
              placeholder values like{" "}
              <code className="rounded bg-white/80 px-1 py-0.5">sk-...</code>) and restart{" "}
              <code className="rounded bg-white/80 px-1 py-0.5">npm run dev</code>.
            </p>
          )}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <AiModeOption
            name="aiMode"
            checked={aiMode === "disabled"}
            onChange={() => setAiMode("disabled")}
            title="Disabled, use built-in rule templates"
            description="No external API. Rules + templates only."
          />
          <AiModeOption
            name="aiMode"
            checked={aiMode === "enabled"}
            disabled={!aiAvailable}
            onChange={() => aiAvailable && setAiMode("enabled")}
            title="Enabled: AI explanations"
            description="Uses OpenAI, Gemini, or Groq (whichever API key is configured on the server)."
          />
        </div>

        <StyledCheckbox
          variant="inline"
          label="Fall back to built-in templates if AI call fails"
          checked={useTemplates}
          onChange={setUseTemplates}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-5">
          <p className="text-sm text-slate-500">
            Rule pack and individual rule toggles are configured in{" "}
            <PermissionLink
              href="/agents/script-review/configure"
              resource="script_review"
              requireWrite
              className="font-medium text-brand-600 hover:underline"
            >
              Configure Rules
            </PermissionLink>
            .
          </p>
          {canEdit ? (
            <button
              type="button"
              onClick={save}
              disabled={loading}
              className="btn-primary shrink-0"
            >
              {saved ? "Saved!" : "Save Settings"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
