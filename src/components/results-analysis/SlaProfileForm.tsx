"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { DEFAULT_SLA_PROFILE } from "@/lib/results-analysis/defaults";
import type { SlaProfile } from "@/lib/results-analysis/types";

export function SlaProfileForm() {
  const [profile, setProfile] = useState<SlaProfile>(DEFAULT_SLA_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/results-analysis/sla")
      .then((r) => r.json())
      .then((data) => {
        if (data.profiles?.[0]) setProfile(data.profiles[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/results-analysis/sla", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...profile, isDefault: true, transactions: [] }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error || "Failed to save");
      return;
    }
    setProfile(data.profile);
    setMessage("SLA profile saved.");
  }

  function updateGlobal(field: keyof SlaProfile, value: number | boolean | string) {
    setProfile((p) => ({ ...p, [field]: value }));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <label className="block text-sm font-medium text-slate-700">Profile Name</label>
        <input
          className="input mt-1 max-w-md"
          value={profile.name}
          onChange={(e) => updateGlobal("name", e.target.value)}
        />
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-slate-900">Global SLA</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <NumberField label="Max Error Rate (%)" value={profile.maxErrorRatePct} onChange={(v) => updateGlobal("maxErrorRatePct", v)} />
          <NumberField label="Avg Response Time Max (sec)" value={profile.avgResponseTimeMaxSec} onChange={(v) => updateGlobal("avgResponseTimeMaxSec", v)} />
          <NumberField label="P90 Max (sec)" value={profile.p90MaxSec} onChange={(v) => updateGlobal("p90MaxSec", v)} />
          <NumberField label="P95 Max (sec)" value={profile.p95MaxSec} onChange={(v) => updateGlobal("p95MaxSec", v)} />
          <NumberField label="P99 Max (sec)" value={profile.p99MaxSec} onChange={(v) => updateGlobal("p99MaxSec", v)} />
          <NumberField label="Minimum Throughput (/sec)" value={profile.minThroughput} onChange={(v) => updateGlobal("minThroughput", v)} />
        </div>
      </div>

      {message && <p className="text-sm text-green-700">{message}</p>}

      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save SLA Profile
        </button>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="card p-4">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <input
        type="number"
        step="0.01"
        className="input mt-2 w-full"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
