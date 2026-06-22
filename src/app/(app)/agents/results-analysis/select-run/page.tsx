import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SelectTestRunPanel } from "@/components/results-analysis/SelectTestRunPanel";
import { isBlazeMeterConfigured } from "@/lib/results-analysis-service-server";

export default async function SelectTestRunPage() {
  const configured = await isBlazeMeterConfigured();
  if (!configured) {
    redirect("/agents/results-analysis/new");
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          { label: "BlazeMeter Results Analysis", href: "/agents/results-analysis" },
          { label: "Select Test Run" },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Select BlazeMeter Test Run</h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose a completed test run from your configured BlazeMeter project to analyze.
        </p>
      </div>
      <SelectTestRunPanel />
    </div>
  );
}
