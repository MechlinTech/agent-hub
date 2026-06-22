import { NextResponse } from "next/server";
import { getSlaProfiles, saveSlaProfile } from "@/lib/results-analysis-service-server";
import type { SlaProfile } from "@/lib/results-analysis/types";

export async function GET() {
  try {
    const profiles = await getSlaProfiles();
    return NextResponse.json({ profiles });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load SLA profiles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const profile = (await request.json()) as SlaProfile;
    if (!profile.name?.trim()) {
      return NextResponse.json({ error: "Profile name is required" }, { status: 400 });
    }
    const saved = await saveSlaProfile(profile);
    return NextResponse.json({ profile: saved });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save SLA profile" },
      { status: 500 }
    );
  }
}
