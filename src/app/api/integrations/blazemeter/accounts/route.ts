import { NextResponse } from "next/server";
import { listAccounts, BlazeMeterApiError } from "@/lib/blazemeter/client";

export async function GET() {
  try {
    const items = await listAccounts();
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof BlazeMeterApiError ? err.message : "Failed to load accounts";
    const status = err instanceof BlazeMeterApiError && err.status ? err.status : 502;
    return NextResponse.json({ error: message }, { status: status >= 400 ? status : 502 });
  }
}
