"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Upload, Play, FileCode } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { RulePackSelect } from "@/components/agents/RulePackSelect";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { StyledCheckbox, StyledCheckboxGroup } from "@/components/ui/StyledCheckbox";
import { createClient } from "@/lib/supabase/client";
import { prepareReview } from "@/lib/review-service";
import { inferFileType } from "@/lib/storage";
import { RULE_CATEGORY_OPTIONS } from "@/lib/jmx/rule-catalog";
import { applyUserRuleDefaults, DEFAULT_USER_RULE_CONFIG, parseUserRuleConfig } from "@/lib/rule-settings";
import type { ReviewConfig } from "@/lib/types";

const defaultConfig: ReviewConfig = {
  ...applyUserRuleDefaults(DEFAULT_USER_RULE_CONFIG),
};

export default function NewReviewPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState<ReviewConfig>(defaultConfig);
  const [categories, setCategories] = useState<string[]>(defaultConfig.ruleCategories);
  const [assets, setAssets] = useState<{ name: string; type: string; size: number; status: string }[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiProviderLabel, setAiProviderLabel] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data }, aiRes] = await Promise.all([
        supabase
          .from("user_settings")
          .select("ai_recommendation_mode, rule_config")
          .eq("user_id", user.id)
          .single(),
        fetch("/api/ai/status"),
      ]);

      const aiMode = (data?.ai_recommendation_mode as "disabled" | "enabled") ?? "disabled";
      if (data?.rule_config) {
        const ruleDefaults = applyUserRuleDefaults(parseUserRuleConfig(data.rule_config), aiMode);
        setConfig(ruleDefaults);
        setCategories(ruleDefaults.ruleCategories);
      } else if (data?.ai_recommendation_mode) {
        setConfig((c) => ({
          ...c,
          aiRecommendationMode: aiMode,
        }));
      }
      if (aiRes.ok) {
        const ai = await aiRes.json();
        setAiAvailable(ai.configured);
        if (ai.provider && ai.providers) {
          const label = ai.providers.find((p: { id: string }) => p.id === ai.provider)?.label;
          setAiProviderLabel(label ?? ai.provider);
        }
      }
    }
    loadSettings();
  }, []);

  function handleFile(f: File | null) {
    setFile(f);
    if (f) {
      setAssets([
        {
          name: f.name,
          type: "JMX Script",
          size: f.size,
          status: f.name.endsWith(".jmx") ? "valid" : "invalid",
        },
      ]);
    }
  }

  function addAttachment(f: File | null) {
    if (!f) return;
    setAttachments((prev) => [...prev, f]);
    setAssets((prev) => [
      ...prev,
      {
        name: f.name,
        type: inferFileType(f.name),
        size: f.size,
        status: "valid",
      },
    ]);
  }

  async function startReview() {
    if (!file) return;
    setStarting(true);
    setStartError(null);
    try {
      const xml = await file.text();
      const fullConfig = { ...config, ruleCategories: categories, disabledRules: config.disabledRules ?? [] };
      const { reviewId } = await prepareReview(
        { jmx: file, attachments },
        fullConfig
      );
      sessionStorage.setItem(`review-xml-${reviewId}`, xml);
      router.push(`/agents/script-review/${reviewId}/analyzing`);
    } catch (e) {
      setStartError(e instanceof Error ? e.message : "Failed to start review");
      setStarting(false);
    }
  }

  return (
    <div className="pb-24">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents/script-review" },
          { label: "Script Review Agent", href: "/agents/script-review" },
          { label: "New Review" },
        ]}
      />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
            <FileCode className="h-7 w-7 text-brand-600" />
            New Script Review
          </h1>
          <p className="mt-1 text-slate-500">
            Upload your JMX script. Configure review settings and rule categories.{" "}
            <Link href="/agents/script-review/configure" className="text-brand-600 hover:underline">
              Configure default rules
            </Link>
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Script Review Agent · Active
        </span>
      </div>

      <div
        className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
          config.aiRecommendationMode === "enabled"
            ? "border-purple-200 bg-purple-50 text-purple-900"
            : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        <strong>AI Recommendation Mode:</strong>{" "}
        {config.aiRecommendationMode === "enabled"
          ? `Enabled: findings enhanced via ${aiProviderLabel ?? "AI"} after rule scan`
          : "Disabled, using built-in rule templates only"}
        {config.aiRecommendationMode === "enabled" && !aiAvailable && (
          <span className="mt-1 block text-amber-800">
            No AI provider configured. Add OPENAI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY to
            .env.local and restart the dev server. Analysis will fall back to templates.
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-4 font-semibold">Upload JMX Script</h3>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 hover:border-brand-400">
            <Upload className="mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">
              Drag and drop your JMX file or Browse Files
            </p>
            <p className="mt-1 text-xs text-slate-400">.jmx only · Max 200 MB</p>
            <input
              type="file"
              accept=".jmx"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {file && (
            <p className="mt-2 text-sm text-green-600">Selected: {file.name}</p>
          )}
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium text-slate-500">Optional attachments</p>
            {[".csv", ".properties", ".har", ".pdf", ".docx"].map((ext) => (
              <label
                key={ext}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm hover:bg-slate-50"
              >
                <span>Upload {ext} file</span>
                <input
                  type="file"
                  accept={ext}
                  className="hidden"
                  onChange={(e) => addAttachment(e.target.files?.[0] ?? null)}
                />
                <span className="text-brand-600">Browse</span>
              </label>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-4 font-semibold">Review Configuration</h3>
          <div className="space-y-4 text-sm">
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={config.testType === "web"}
                  onChange={() => setConfig({ ...config, testType: "web" })}
                />
                Web
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={config.testType === "api"}
                  onChange={() => setConfig({ ...config, testType: "api" })}
                />
                API
              </label>
            </div>
            <div>
              <label className="font-medium text-slate-700">Rule Pack</label>
              <RulePackSelect
                value={config.rulePack}
                onChange={(rulePack) => setConfig({ ...config, rulePack })}
              />
            </div>
            <StyledCheckbox
              variant="row"
              label="Include Security Checks"
              checked={config.includeSecurity}
              onChange={(includeSecurity) => setConfig({ ...config, includeSecurity })}
            />
            <StyledCheckbox
              variant="row"
              label="Include BlazeMeter Readiness"
              checked={config.includeBlazeMeter}
              onChange={(includeBlazeMeter) => setConfig({ ...config, includeBlazeMeter })}
            />
            <div>
              <label className="font-medium text-slate-700">Severity Threshold</label>
              <StyledSelect
                className="mt-1"
                value={config.severityThreshold}
                onChange={(severityThreshold) => setConfig({ ...config, severityThreshold })}
                options={[
                  { value: "critical", label: "Critical only" },
                  { value: "high", label: "High and above" },
                  { value: "medium", label: "Medium and above" },
                  { value: "all", label: "All severities" },
                ]}
              />
            </div>
            <div>
              <label className="font-medium text-slate-700">AI Recommendation (this review)</label>
              <StyledSelect
                className="mt-1"
                value={config.aiRecommendationMode}
                onChange={(aiRecommendationMode) =>
                  setConfig({
                    ...config,
                    aiRecommendationMode: aiRecommendationMode as "disabled" | "enabled",
                  })
                }
                options={[
                  { value: "disabled", label: "Disabled, built-in templates" },
                  {
                    value: "enabled",
                    label: `Enabled: AI enhancements${
                      !aiAvailable
                        ? " (no provider configured)"
                        : aiProviderLabel
                          ? ` (${aiProviderLabel})`
                          : ""
                    }`,
                    disabled: !aiAvailable,
                  },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="card p-6 lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Rule Categories</h3>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCategories(RULE_CATEGORY_OPTIONS.map((c) => c.id))}
                className="text-brand-600"
              >
                Select All
              </button>
              <button type="button" onClick={() => setCategories([])} className="text-slate-500">
                Clear All
              </button>
            </div>
          </div>
          <StyledCheckboxGroup
            variant="card"
            items={RULE_CATEGORY_OPTIONS.map((cat) => ({
              key: cat.id,
              label: cat.label,
              description: cat.desc,
            }))}
            values={Object.fromEntries(
              RULE_CATEGORY_OPTIONS.map((cat) => [cat.id, categories.includes(cat.id)]),
            ) as Record<string, boolean>}
            onChange={(catId, checked) => {
              if (checked) setCategories([...categories, catId]);
              else setCategories(categories.filter((c) => c !== catId));
            }}
          />
        </div>

        <div className="card p-6">
          <h3 className="mb-4 font-semibold">Detected Assets</h3>
          {assets.length ? (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr>
                  <th className="pb-2">File</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.name}>
                    <td className="py-1 font-medium">{a.name}</td>
                    <td>{a.type}</td>
                    <td className={a.status === "valid" ? "text-green-600" : "text-red-600"}>
                      {a.status === "valid" ? "Valid ✓" : "Invalid"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-400">Upload a JMX file to scan assets</p>
          )}
        </div>
      </div>

      {startError && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">{startError}</p>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 safe-bottom sm:px-6 lg:left-56">
        <Link href="/agents/script-review" className="text-sm text-slate-600 hover:text-slate-900">
          Cancel
        </Link>
        <button
          type="button"
          disabled={!file || starting}
          onClick={startReview}
          className="btn-primary inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          {starting ? "Starting..." : "Start Review"}
        </button>
      </div>
    </div>
  );
}
