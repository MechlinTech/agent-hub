"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StyledSelect } from "@/components/ui/StyledSelect";

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "resolved", label: "Resolved" },
  { value: "wont_fix", label: "Won't Fix" },
];

export function FindingActions({
  findingId,
  reviewId,
  currentStatus,
  nextFindingId,
}: {
  findingId: string;
  reviewId: string;
  currentStatus: string;
  nextFindingId?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function updateStatus(newStatus: string) {
    setSaving(true);
    const res = await fetch(`/api/findings/${findingId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setStatus(newStatus);
    setSaving(false);
  }

  return (
    <div className="card space-y-3 p-4 text-sm">
      <h3 className="font-semibold">Actions</h3>
      <button
        type="button"
        disabled={saving || status === "acknowledged"}
        onClick={() => updateStatus("acknowledged")}
        className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        Mark as Acknowledged
      </button>
      <div>
        <label className="text-xs text-slate-500">Status</label>
        <StyledSelect
          className="mt-1"
          value={status}
          disabled={saving}
          onChange={updateStatus}
          options={STATUSES}
        />
      </div>
      {nextFindingId && (
        <button
          type="button"
          onClick={() =>
            router.push(`/agents/script-review/${reviewId}/findings/${nextFindingId}`)
          }
          className="w-full text-brand-600 hover:underline"
        >
          Next Finding →
        </button>
      )}
    </div>
  );
}
