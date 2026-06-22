import { NextResponse } from "next/server";
import {
  createExecutiveSummaryLibraryEntry,
  listExecutiveSummaryLibrary,
} from "@/lib/executive-summary-library-service-server";
import type { ScriptSummaryRow } from "@/lib/results-analysis/types";

export async function GET() {
  try {
    const entries = await listExecutiveSummaryLibrary(100);
    return NextResponse.json({ entries });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load library" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      analysisId?: string | null;
      runName?: string;
      externalId?: string | null;
      masterId?: string | null;
      testContext?: {
        projectName?: string;
        environment?: string;
        buildVersion?: string;
      } | null;
      scriptSummaries?: ScriptSummaryRow[];
    };

    if (!body.scriptSummaries?.length) {
      return NextResponse.json(
        { error: "scriptSummaries is required and must not be empty" },
        { status: 400 }
      );
    }

    const entry = await createExecutiveSummaryLibraryEntry({
      analysisId: body.analysisId ?? null,
      runName: body.runName?.trim() || "Script-Level Executive Summary",
      externalId: body.externalId ?? null,
      masterId: body.masterId ?? null,
      testContext: body.testContext ?? null,
      scriptSummaries: body.scriptSummaries,
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to export to library" },
      { status: 500 }
    );
  }
}
