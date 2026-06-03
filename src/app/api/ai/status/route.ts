import { NextResponse } from "next/server";
import { getAiStatus } from "@/lib/ai/providers";

export async function GET() {
  const status = getAiStatus();
  return NextResponse.json({
    configured: status.configured,
    provider: status.provider,
    model: status.model,
    providers: status.providers.map((p) => ({
      id: p.id,
      label: p.label,
      configured: p.configured,
      model: p.model,
    })),
  });
}
