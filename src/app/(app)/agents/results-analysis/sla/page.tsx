import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SlaProfileForm } from "@/components/results-analysis/SlaProfileForm";

export default function SlaConfigurationPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          { label: "BlazeMeter Results Analysis", href: "/agents/results-analysis" },
          { label: "Configure SLA" },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">SLA Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Define global SLA thresholds used during analysis.
        </p>
      </div>
      <SlaProfileForm />
    </div>
  );
}
