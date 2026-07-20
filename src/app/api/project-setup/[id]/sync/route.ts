import { NextResponse } from "next/server";
import { requireWrite } from "@/lib/supabase/get-auth-context";
import { syncProjectSetup } from "@/lib/project-setup-service-server";
import type { ProjectSetupLogEntry, ProjectSetupResult, ProjectSetupStatus } from "@/lib/project-setup/types";
import { isProjectSetupEnabled } from "@/lib/project-setup/env";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isProjectSetupEnabled()) {
    return NextResponse.json({ error: "Dev Scaffold Agent is disabled" }, { status: 503 });
  }
  const { response } = await requireWrite("project_setup");
  if (response) return response;

  try {
    const { id } = await params;
    const body = (await request.json()) as {
      status?: ProjectSetupStatus;
      progressPercent?: number;
      currentStep?: string | null;
      logs?: ProjectSetupLogEntry[];
      result?: ProjectSetupResult | null;
      errorMessage?: string | null;
    };

    if (!body.status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const setup = await syncProjectSetup(id, {
      status: body.status,
      progressPercent: body.progressPercent,
      currentStep: body.currentStep,
      logs: body.logs,
      result: body.result,
      errorMessage: body.errorMessage,
    });

    return NextResponse.json({ setup });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 400 }
    );
  }
}
