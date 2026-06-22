import { NextResponse } from "next/server";
import {
  isBlazeMeterConfigured,
  listBlazeMeterTestRuns,
} from "@/lib/results-analysis-service-server";

export async function GET() {
  try {
    const configured = await isBlazeMeterConfigured();
    if (!configured) {
      return NextResponse.json(
        { error: "BlazeMeter API is not configured", configured: false },
        { status: 400 }
      );
    }
    const runs = await listBlazeMeterTestRuns();
    return NextResponse.json({ configured: true, runs });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load test runs" },
      { status: 502 }
    );
  }
}
