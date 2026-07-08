import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLatestExecutorBinary } from "@/lib/executor-binaries-service-server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const binary = await getLatestExecutorBinary();

    return NextResponse.json({
      version: binary?.version?.trim() || null,
      hasDownload: Boolean(binary?.path),
      name: binary?.name ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load executor version" },
      { status: 500 },
    );
  }
}
