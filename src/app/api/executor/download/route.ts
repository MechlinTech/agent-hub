import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLatestExecutorDownload } from "@/lib/executor-binaries-service-server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const latest = await getLatestExecutorDownload();
    if (!latest?.downloadUrl) {
      return NextResponse.json({ error: "No executor build available" }, { status: 404 });
    }

    return NextResponse.redirect(latest.downloadUrl);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create download link" },
      { status: 500 },
    );
  }
}
