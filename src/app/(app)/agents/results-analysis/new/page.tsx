import { Suspense } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { NewAnalysisForm } from "@/components/results-analysis/NewAnalysisForm";
import { isBlazeMeterConfigured } from "@/lib/results-analysis-service-server";

export default async function NewResultsAnalysisPage() {
  const blazemeterConfigured = await isBlazeMeterConfigured();

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          { label: "BlazeMeter Results Analysis", href: "/agents/results-analysis" },
          { label: "New Analysis" },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Analyze New BlazeMeter Result</h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose how you&apos;d like to provide your BlazeMeter result data for analysis.
        </p>
      </div>
      <NewAnalysisForm blazemeterConfigured={blazemeterConfigured} />
    </div>
  );
}
