import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SelectTestRunPanel } from "@/components/results-analysis/SelectTestRunPanel";
import { isBlazeMeterConfigured } from "@/lib/results-analysis-service-server";

export default async function SelectTestRunPage() {
  const configured = await isBlazeMeterConfigured();

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

      {!configured ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">BlazeMeter API is not fully configured yet.</p>
          <p className="mt-1 text-amber-900/90">
            Add API credentials plus account, workspace, and project under Integrations to
            list test runs here. You can still{" "}
            <Link href="/agents/results-analysis/new" className="font-semibold underline">
              upload CSV exports
            </Link>{" "}
            without the API.
          </p>
        </div>
      ) : null}

      <SelectTestRunPanel configured={configured} />
    </div>
  );
}
