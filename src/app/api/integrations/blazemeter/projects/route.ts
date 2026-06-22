import { NextResponse } from "next/server";
import { listProjects, BlazeMeterApiError } from "@/lib/blazemeter/client";

export async function GET(request: Request) {
  const workspaceId = Number(new URL(request.url).searchParams.get("workspaceId"));
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  try {
    const items = await listProjects(workspaceId);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof BlazeMeterApiError ? err.message : "Failed to load projects";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
