import { NextResponse } from "next/server";
import { requireAdminOrSuperAdmin } from "@/lib/supabase/get-auth-context";
import { getExecutorBinaryDownloadUrl } from "@/lib/executor-binaries-service-server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { response } = await requireAdminOrSuperAdmin();
  if (response) return response;

  try {
    const download = await getExecutorBinaryDownloadUrl(params.id);
    if (!download?.downloadUrl) {
      return NextResponse.json({ error: "Build file not found" }, { status: 404 });
    }

    return NextResponse.redirect(download.downloadUrl);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create download link" },
      { status: 500 },
    );
  }
}
