import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { BlazeMeterSourcePanel } from "@/components/results-analysis/BlazeMeterSourcePanel";
import { getResultsAnalysis } from "@/lib/results-analysis-service-server";

export default async function BlazeMeterSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const analysis = await getResultsAnalysis(id);
  if (!analysis) notFound();

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          { label: "BlazeMeter Results Analysis", href: "/agents/results-analysis" },
          { label: analysis.runName, href: `/agents/results-analysis/${id}` },
          { label: "BlazeMeter Results" },
        ]}
      />
      <BlazeMeterSourcePanel analysis={analysis} />
    </div>
  );
}
