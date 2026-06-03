import { NextResponse } from "next/server";
import { getEnvSafe } from "@/lib/env";

export async function GET() {
  const env = getEnvSafe();
  return NextResponse.json({
    status: env ? "ok" : "degraded",
    service: "agent-hub",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    checks: {
      supabaseConfigured: Boolean(env),
    },
  });
}
