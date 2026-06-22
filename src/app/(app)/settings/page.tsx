"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { createClient } from "@/lib/supabase/client";
import type { AiRecommendationMode } from "@/lib/types";

interface ProviderStatus {
  id: string;
  label: string;
  configured: boolean;
  model: string;
}

export default function SettingsPage() {
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
        supabase.from("profiles").select("full_name, team_name").eq("id", user.id).single(),
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
    setError(null);
    if (aiMode === "enabled" && !aiAvailable) {
      setError(
        "Cannot enable AI mode. Set at least one of OPENAI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY in .env.local and restart the dev server."
      );
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: settingsError } = await supabase.from("user_settings").upsert({
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
    providers.find((p) => p.id === activeProvider)?.label ?? activeProvider ?? "Unknown";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Breadcrumbs items={[{ label: "Home", href: "/dashboard" }, { label: "Settings" }]} />
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-slate-500">Profile and Script Review Agent configuration</p>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-slate-900">Profile</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Team</label>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-slate-900">AI Recommendation Mode</h2>
        <p className="mt-1 text-sm text-slate-500">
          Rules detect issues; AI enhances impact text and recommendations when enabled.
        </p>

        <div className="mt-3 space-y-2 rounded-lg border px-3 py-3 text-sm">
          <p>
            Active provider:{" "}
            {aiAvailable ? (
              <span className="font-medium text-green-700">
                {activeLabel} ({activeModel})
              </span>
            ) : (
              <span className="font-medium text-amber-700">None configured</span>
            )}
          </p>
          <ul className="space-y-1 text-slate-600">
            {providers.map((p) => (
              <li key={p.id} className="flex items-center justify-between">
                <span>{p.label}</span>
                <span className={p.configured ? "text-green-700" : "text-slate-400"}>
                  {p.configured ? `Ready · ${p.model}` : "Not configured"}
                </span>
              </li>
            ))}
          </ul>
          {!aiAvailable && (
            <p className="text-xs text-amber-700">
              Add a real API key to <code className="rounded bg-slate-100 px-1">.env.local</code>{" "}
              (not placeholder values like <code className="rounded bg-slate-100 px-1">sk-...</code>
              ) and restart <code className="rounded bg-slate-100 px-1">npm run dev</code>.
            </p>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-slate-50">
            <input
              type="radio"
              name="aiMode"
              checked={aiMode === "disabled"}
              onChange={() => setAiMode("disabled")}
              className="mt-1"
            />
            <div>
              <span className="font-medium">Disabled, use built-in rule templates</span>
              <p className="text-sm text-slate-500">No external API. Rules + templates only.</p>
            </div>
          </label>

          <label
            className={`flex items-start gap-3 rounded-lg border p-3 ${
              aiAvailable ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-60"
            }`}
          >
            <input
              type="radio"
              name="aiMode"
              checked={aiMode === "enabled"}
              disabled={!aiAvailable}
              onChange={() => aiAvailable && setAiMode("enabled")}
              className="mt-1"
            />
            <div>
              <span className="font-medium">Enabled: AI explanations</span>
              <p className="text-sm text-slate-500">
                Uses OpenAI, Gemini, or Groq (whichever API key is configured on the server).
              </p>
            </div>
          </label>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useTemplates}
            onChange={(e) => setUseTemplates(e.target.checked)}
          />
          Fall back to built-in templates if AI call fails
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={save}
          disabled={loading}
          className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saved ? "Saved!" : "Save Settings"}
        </button>

        <p className="mt-4 text-sm text-slate-500">
          Rule pack and individual rule toggles are configured in{" "}
          <Link href="/agents/script-review/configure" className="text-brand-600 hover:underline">
            Configure Rules
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
