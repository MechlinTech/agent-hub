"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RotateCcw, Save } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { RulePackSelect } from "@/components/agents/RulePackSelect";
import { createClient } from "@/lib/supabase/client";
import { getRuleIdsForPack } from "@/lib/jmx/rule-packs";
import { getRuleCatalog, RULE_CATEGORY_OPTIONS } from "@/lib/jmx/rule-catalog";
import {
  DEFAULT_USER_RULE_CONFIG,
  parseUserRuleConfig,
  toggleRule,
  type UserRuleConfig,
} from "@/lib/rule-settings";
import { cn, severityColor } from "@/lib/utils";

export function RuleConfigurePanel() {
  const [config, setConfig] = useState<UserRuleConfig>(DEFAULT_USER_RULE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "enabled" | "disabled" | "in_pack">("all");

  const catalog = useMemo(() => getRuleCatalog(), []);
  const packRuleIds = useMemo(() => new Set(getRuleIdsForPack(config.rulePack)), [config.rulePack]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_settings")
        .select("rule_config")
        .eq("user_id", user.id)
        .single();

      if (data?.rule_config) {
        setConfig(parseUserRuleConfig(data.rule_config));
      }
      setLoading(false);
    }
    load();
  }, []);

  function isRuleOn(ruleId: string) {
    return !config.disabledRules.includes(ruleId) && packRuleIds.has(ruleId);
  }

  function setRuleEnabled(ruleId: string, enabled: boolean) {
    setConfig((c) => ({
      ...c,
      disabledRules: toggleRule(c.disabledRules, ruleId, enabled),
    }));
  }

  function toggleCategory(catId: string, on: boolean) {
    setConfig((c) => ({
      ...c,
      ruleCategories: on
        ? Array.from(new Set([...c.ruleCategories, catId]))
        : c.ruleCategories.filter((id) => id !== catId),
    }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: saveError } = await supabase.from("user_settings").upsert({
      user_id: user.id,
      rule_config: config,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function resetDefaults() {
    setConfig({ ...DEFAULT_USER_RULE_CONFIG });
  }

  const filteredRules = catalog.filter((rule) => {
    const inPack = packRuleIds.has(rule.id);
    const enabled = isRuleOn(rule.id);
    if (filter === "enabled") return enabled;
    if (filter === "disabled") return !enabled;
    if (filter === "in_pack") return inPack;
    return true;
  });

  const enabledCount = catalog.filter((r) => isRuleOn(r.id)).length;

  if (loading) {
    return <p className="text-slate-500">Loading rule configuration...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/dashboard" },
              { label: "Script Review Agent", href: "/agents/script-review" },
              { label: "Configure Rules" },
            ]}
          />
          <h1 className="text-2xl font-bold text-slate-900">Configure Rules</h1>
          <p className="mt-1 max-w-2xl text-slate-500">
            Set default rule pack, categories, and individual rule toggles. New reviews inherit these
            settings automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetDefaults}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saved ? "Saved!" : saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900">Default Review Settings</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <label className="font-medium text-slate-700">Default Rule Pack</label>
              <RulePackSelect
                value={config.rulePack}
                onChange={(rulePack) => setConfig({ ...config, rulePack })}
              />
              <p className="mt-1 text-xs text-slate-400">
                {packRuleIds.size} rules included in this pack
              </p>
            </div>

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
              <label className="font-medium text-slate-700">Severity Threshold</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={config.severityThreshold}
                onChange={(e) => setConfig({ ...config, severityThreshold: e.target.value })}
              >
                <option value="critical">Critical only</option>
                <option value="high">High and above</option>
                <option value="medium">Medium and above</option>
                <option value="low">Low and above</option>
                <option value="all">All severities</option>
              </select>
            </div>

            <label className="flex items-center justify-between">
              <span>Include Security Checks</span>
              <input
                type="checkbox"
                checked={config.includeSecurity}
                onChange={(e) => setConfig({ ...config, includeSecurity: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Include BlazeMeter Readiness</span>
              <input
                type="checkbox"
                checked={config.includeBlazeMeter}
                onChange={(e) => setConfig({ ...config, includeBlazeMeter: e.target.checked })}
              />
            </label>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Rule Categories</h2>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                className="text-brand-600"
                onClick={() =>
                  setConfig({
                    ...config,
                    ruleCategories: RULE_CATEGORY_OPTIONS.map((c) => c.id),
                  })
                }
              >
                Select all
              </button>
              <button
                type="button"
                className="text-slate-500"
                onClick={() => setConfig({ ...config, ruleCategories: [] })}
              >
                Clear
              </button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {RULE_CATEGORY_OPTIONS.map((cat) => (
              <label
                key={cat.id}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-100 p-2 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={config.ruleCategories.includes(cat.id)}
                  onChange={(e) => toggleCategory(cat.id, e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">{cat.label}</p>
                  <p className="text-xs text-slate-400">{cat.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="font-semibold text-slate-900">Individual Rules</h2>
            <p className="text-xs text-slate-500">
              {enabledCount} of {catalog.length} rules active for your pack and toggles
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            {(["all", "in_pack", "enabled", "disabled"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-medium",
                  filter === f
                    ? "bg-brand-100 text-brand-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {f === "in_pack" ? "In pack" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">On</th>
                <th className="px-4 py-2">Rule</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Severity</th>
                <th className="px-4 py-2">Issue</th>
                <th className="px-4 py-2">Pack</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule) => {
                const inPack = packRuleIds.has(rule.id);
                const enabled = isRuleOn(rule.id);
                return (
                  <tr
                    key={rule.id}
                    className={cn(
                      "border-t border-slate-50",
                      !enabled && "bg-slate-50/80 text-slate-500"
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={enabled}
                        disabled={!inPack}
                        onChange={(e) => setRuleEnabled(rule.id, e.target.checked)}
                        title={!inPack ? "Not included in selected rule pack" : undefined}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-medium">{rule.id}</td>
                    <td className="px-4 py-3">{rule.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs capitalize",
                          severityColor(rule.severity)
                        )}
                      >
                        {rule.severity}
                      </span>
                    </td>
                    <td className="max-w-md px-4 py-3">{rule.issue}</td>
                    <td className="px-4 py-3">
                      {inPack ? (
                        <span className="text-green-600">Included</span>
                      ) : (
                        <span className="text-slate-400">Excluded</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-sm text-slate-500">
        These defaults apply to{" "}
        <Link href="/agents/script-review/new" className="text-brand-600 hover:underline">
          New Review
        </Link>
        . You can still override settings per review.
      </p>
    </div>
  );
}
