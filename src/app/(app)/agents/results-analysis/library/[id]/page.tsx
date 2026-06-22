import { notFound } from "next/navigation";
import { ExecutiveSummaryLibraryDetail } from "@/components/results-analysis/ExecutiveSummaryLibraryDetail";
import { getExecutiveSummaryLibraryEntry } from "@/lib/executive-summary-library-service-server";

export default async function ExecutiveSummaryLibraryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await getExecutiveSummaryLibraryEntry(id);
  if (!entry) notFound();
  return <ExecutiveSummaryLibraryDetail initialEntry={entry} />;
}
