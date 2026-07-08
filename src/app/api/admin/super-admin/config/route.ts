import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/supabase/get-auth-context";
import {
  getAdminConfigurableResources,
  saveAdminConfigurableResources,
} from "@/lib/role-access-defaults-server";
import { RESOURCES } from "@/lib/permissions";

export async function GET() {
  const { response } = await requireSuperAdmin();
  if (response) return response;

  try {
    const resources = await getAdminConfigurableResources();
    return NextResponse.json({
      resources: resources ?? [...RESOURCES],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load admin visibility settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { response } = await requireSuperAdmin();
  if (response) return response;

  try {
    const body = await request.json();
    const resources = body.resources as string[] | undefined;
    if (!Array.isArray(resources)) {
      return NextResponse.json({ error: "resources array is required" }, { status: 400 });
    }

    const valid = resources.filter((item) => RESOURCES.includes(item as typeof RESOURCES[number]));
    if (valid.length === 0) {
      return NextResponse.json(
        { error: "At least one valid resource is required" },
        { status: 400 }
      );
    }

    await saveAdminConfigurableResources(valid as typeof RESOURCES[number][]);
    return NextResponse.json({ resources: valid });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save admin visibility settings" },
      { status: 500 }
    );
  }
}
