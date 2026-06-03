"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function RerunReviewButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function rerun() {
    setLoading(true);
    const res = await fetch(`/api/reviews/${reviewId}/rerun`, { method: "POST" });
    const data = await res.json();
    if (data.redirect) router.push(data.redirect);
    setLoading(false);
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={rerun}
      className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      Re-run Review
    </button>
  );
}
