import { NextResponse } from "next/server";
import { defectsToJiraPayload } from "@/lib/results-analysis/defect-generator";
import { getResultsAnalysis } from "@/lib/results-analysis-service-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const analysis = await getResultsAnalysis(id);
    if (!analysis?.resultPayload) {
      return NextResponse.json({ error: "Analysis not found or not completed" }, { status: 404 });
    }

    const defects = analysis.resultPayload.defects ?? [];
    const format = new URL(request.url).searchParams.get("format");

    if (format === "jira") {
      const payload = defectsToJiraPayload(defects);
      return NextResponse.json(
        {
          analysisId: analysis.id,
          runName: analysis.runName,
          generatedAt: new Date().toISOString(),
          issues: payload,
        },
        {
          headers: {
            "Content-Disposition": `attachment; filename="${analysis.runName}-jira-defects.json"`,
          },
        }
      );
    }

    return NextResponse.json(
      {
        analysisId: analysis.id,
        runName: analysis.runName,
        generatedAt: new Date().toISOString(),
        defects,
      },
      {
        headers: {
          "Content-Disposition": `attachment; filename="${analysis.runName}-defects.json"`,
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to export defects" },
      { status: 500 }
    );
  }
}
