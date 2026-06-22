import { NextResponse } from "next/server";
import { previewBlazeMeterRun } from "@/lib/results-analysis-service-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ masterId: string }> }
) {
  try {
    const { masterId } = await params;
    const preview = await previewBlazeMeterRun(masterId);
    return NextResponse.json({ preview });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load run preview" },
      { status: 502 }
    );
  }
}
