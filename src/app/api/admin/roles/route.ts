import { NextResponse } from "next/server";
import { requireRead, requireWrite } from "@/lib/supabase/get-auth-context";
import {
  getCustomRoles,
  getRoleAccessDefaults,
  mergeRoleDefaultsForApi,
  saveRoleAccessDefaults,
} from "@/lib/role-access-defaults-server";
import type { BuiltInRole, Resource, AccessLevel, RoleAccessDefaults } from "@/lib/permissions";
import { BUILT_IN_ROLES, RESOURCES } from "@/lib/permissions";

export async function GET() {
  const { response } = await requireRead("users");
  if (response) return response;

  try {
    const [stored, customRoles] = await Promise.all([
      getRoleAccessDefaults(),
      getCustomRoles(),
    ]);
    return NextResponse.json(mergeRoleDefaultsForApi(stored, customRoles));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load role permissions" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { response } = await requireWrite("users");
  if (response) return response;

  try {
    const body = await request.json();
    const roles = body.roles as Partial<Record<BuiltInRole, Record<Resource, AccessLevel>>> | undefined;
    if (!roles) {
      return NextResponse.json({ error: "roles object is required" }, { status: 400 });
    }

    const payload: RoleAccessDefaults = {};
    for (const role of BUILT_IN_ROLES) {
      if (role === "admin") continue;
      const matrix = roles[role];
      if (!matrix) continue;
      for (const resource of RESOURCES) {
        const level = matrix[resource];
        if (!level || !["none", "read", "write"].includes(level)) {
          return NextResponse.json(
            { error: `Invalid access for ${role}.${resource}` },
            { status: 400 }
          );
        }
      }
      payload[role] = matrix as Record<Resource, AccessLevel>;
    }

    await saveRoleAccessDefaults(payload);
    const [stored, customRoles] = await Promise.all([
      getRoleAccessDefaults(),
      getCustomRoles(),
    ]);
    return NextResponse.json(mergeRoleDefaultsForApi(stored, customRoles));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save role permissions" },
      { status: 500 }
    );
  }
}
