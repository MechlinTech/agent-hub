import { NextResponse } from "next/server";
import { listWorkspaces, BlazeMeterApiError } from "@/lib/blazemeter/client";

export async function GET(request: Request) {
  const accountId = Number(new URL(request.url).searchParams.get("accountId"));
  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  try {
    const items = await listWorkspaces(accountId);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof BlazeMeterApiError ? err.message : "Failed to load workspaces";
    const status = err instanceof BlazeMeterApiError && err.status ? err.status : 502;
    return NextResponse.json({ error: message }, { status: status >= 400 ? status : 502 });
  }
}
