import { Suspense } from "react";
import { AnalyzingProgress } from "@/components/results-analysis/AnalyzingProgress";

export default function AnalyzingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading analysis…</div>}>
      <AnalyzingProgress />
    </Suspense>
  );
}
