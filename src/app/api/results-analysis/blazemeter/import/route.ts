import { NextResponse } from "next/server";
import { importBlazeMeterMaster } from "@/lib/results-analysis-service-server";
import type { TestContext } from "@/lib/results-analysis/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      masterId?: string;
      analysisId?: string;
      testContext?: Partial<TestContext>;
    };
    if (!body.analysisId?.trim() && !body.masterId?.trim()) {
      return NextResponse.json(
        { error: "masterId or analysisId is required" },
        { status: 400 }
      );
    }
    const result = await importBlazeMeterMaster({
      masterId: body.masterId?.trim(),
      analysisId: body.analysisId?.trim(),
      testContext: body.testContext,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Import failed" },
      { status: 502 }
    );
  }
}
