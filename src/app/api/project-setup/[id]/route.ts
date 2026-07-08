import { NextResponse } from "next/server";
import { requireRead } from "@/lib/supabase/get-auth-context";
import { getProjectSetup } from "@/lib/project-setup-service-server";
import { isProjectSetupEnabled } from "@/lib/project-setup/env";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isProjectSetupEnabled()) {
    return NextResponse.json({ error: "Project Setup Agent is disabled" }, { status: 503 });
  }
  const { response } = await requireRead("project_setup");
  if (response) return response;

  try {
    const { id } = await params;
    const setup = await getProjectSetup(id);
    if (!setup) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ setup });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load setup" },
      { status: 500 }
    );
  }
}
