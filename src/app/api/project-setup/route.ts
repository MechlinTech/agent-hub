import { NextResponse } from "next/server";
import { requireRead, requireWrite } from "@/lib/supabase/get-auth-context";
import {
  createProjectSetup,
  listProjectSetups,
} from "@/lib/project-setup-service-server";
import type { ProjectSetupConfig } from "@/lib/project-setup/types";
import { isProjectSetupEnabled } from "@/lib/project-setup/env";

export async function GET() {
  if (!isProjectSetupEnabled()) {
    return NextResponse.json({ error: "Dev Scaffold Agent is disabled" }, { status: 503 });
  }
  const { response } = await requireRead("project_setup");
  if (response) return response;

  try {
    const setups = await listProjectSetups();
    return NextResponse.json({ setups });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list setups" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isProjectSetupEnabled()) {
    return NextResponse.json({ error: "Dev Scaffold Agent is disabled" }, { status: 503 });
  }
  const { response } = await requireWrite("project_setup");
  if (response) return response;

  try {
    const body = (await request.json()) as { config?: ProjectSetupConfig };
    if (!body.config) {
      return NextResponse.json({ error: "config is required" }, { status: 400 });
    }
    const result = await createProjectSetup(body.config);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create setup" },
      { status: 400 }
    );
  }
}
