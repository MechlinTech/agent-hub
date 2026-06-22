import { notFound, redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ResultsDashboard } from "@/components/results-analysis/ResultsDashboard";
import { getResultsAnalysis } from "@/lib/results-analysis-service-server";

export default async function ResultsAnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const analysis = await getResultsAnalysis(id);
  if (!analysis) notFound();

  if (analysis.status !== "completed") {
    redirect(`/agents/results-analysis/${id}/analyzing`);
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          { label: "BlazeMeter Results Analysis", href: "/agents/results-analysis" },
          { label: analysis.runName },
        ]}
      />
      <ResultsDashboard analysis={analysis} />
    </div>
  );
}
