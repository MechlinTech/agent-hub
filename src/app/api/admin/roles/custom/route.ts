import { NextResponse } from "next/server";
import { requireWrite } from "@/lib/supabase/get-auth-context";
import { createCustomRole, getCustomRoles, mergeRoleDefaultsForApi, getRoleAccessDefaults } from "@/lib/role-access-defaults-server";
import type { Resource, AccessLevel } from "@/lib/permissions";
import { parseAccessMatrix } from "@/lib/permissions";

export async function POST(request: Request) {
  const { response } = await requireWrite("users");
  if (response) return response;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name : "";
    const access = parseAccessMatrix(body.access as Record<Resource, AccessLevel> | undefined);
    const role = await createCustomRole(name, access ?? undefined);
    const [stored, customRoles] = await Promise.all([
      getRoleAccessDefaults(),
      getCustomRoles(),
    ]);
    return NextResponse.json({
      role,
      ...mergeRoleDefaultsForApi(stored, customRoles),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create custom role" },
      { status: 400 }
    );
  }
}
