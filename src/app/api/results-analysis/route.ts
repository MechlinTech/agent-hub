import { NextResponse } from "next/server";
import { requireRead, requireWrite } from "@/lib/supabase/get-auth-context";
import {
  createResultsAnalysis,
  listResultsAnalyses,
} from "@/lib/results-analysis-service-server";
import type { TestContext } from "@/lib/results-analysis/types";
import { DEFAULT_TEST_CONTEXT } from "@/lib/results-analysis/defaults";

export async function GET() {
  const { response } = await requireRead("results_analysis");
  if (response) return response;

  try {
    const analyses = await listResultsAnalyses();
    return NextResponse.json({ analyses });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list analyses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { response } = await requireWrite("results_analysis");
  if (response) return response;

  try {
    const body = (await request.json()) as {
      runName?: string;
      testContext?: Partial<TestContext>;
      masterId?: string;
      inputMethod?: "csv" | "api" | "manual";
    };
    if (!body.runName?.trim()) {
      return NextResponse.json({ error: "runName is required" }, { status: 400 });
    }
    const testContext: TestContext = { ...DEFAULT_TEST_CONTEXT, ...body.testContext };
    const { analysisId } = await createResultsAnalysis({
      runName: body.runName.trim(),
      testContext,
      masterId: body.masterId,
      inputMethod: body.inputMethod,
    });
    return NextResponse.json({ analysisId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create analysis" },
      { status: 500 }
    );
  }
}
