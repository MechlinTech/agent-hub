import { NextResponse } from "next/server";
import { listPerformanceTests, BlazeMeterApiError } from "@/lib/blazemeter/client";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const projectId = Number(params.get("projectId"));
  const workspaceId = Number(params.get("workspaceId"));
  if (!projectId || !workspaceId) {
    return NextResponse.json(
      { error: "projectId and workspaceId are required" },
      { status: 400 }
    );
  }

  try {
    const items = await listPerformanceTests(projectId, workspaceId);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof BlazeMeterApiError ? err.message : "Failed to load tests";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
