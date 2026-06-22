"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function BlazeMeterReimportButton({
  analysisId,
  masterId,
  className,
  label = "Re-import from BlazeMeter",
}: {
  analysisId: string;
  masterId: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/results-analysis/blazemeter/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, masterId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Re-import failed");
      router.push(`/agents/results-analysis/${data.analysisId}/analyzing`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Re-import failed");
      setLoading(false);
    }
  }

  return (
    <div className={cn(className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="btn-secondary inline-flex items-center gap-1.5 text-sm disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {loading ? "Re-importing…" : label}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
