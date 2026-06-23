import { NextResponse } from "next/server";
import { requireRead, requireWrite } from "@/lib/supabase/get-auth-context";
import {
  getCustomRoles,
  getRoleAccessDefaults,
  mergeRoleDefaultsForApi,
  saveRoleAccessDefaults,
} from "@/lib/role-access-defaults-server";
import type { BuiltInRole, Resource, AccessLevel, RoleAccessDefaults } from "@/lib/permissions";
import {
  BUILT_IN_ROLES,
  filterAccessMatrix,
  getConfigurableResources,
  getRoleBaseAccess,
} from "@/lib/permissions";

export async function GET() {
  const { ctx, response } = await requireRead("users");
  if (response) return response;

  try {
    const [stored, customRoles] = await Promise.all([
      getRoleAccessDefaults(),
      getCustomRoles(),
    ]);
    const adminConfigurable = ctx!.configurableResources;
    const payload = mergeRoleDefaultsForApi(stored, customRoles, adminConfigurable);

    if (!ctx!.isSuperAdmin) {
      const configurable = getConfigurableResources(adminConfigurable, false);
      const filteredEffective = Object.fromEntries(
        BUILT_IN_ROLES.map((role) => [
          role,
          filterAccessMatrix(payload.effective[role], configurable),
        ])
      ) as Record<BuiltInRole, Record<Resource, AccessLevel>>;
      return NextResponse.json({
        ...payload,
        effective: filteredEffective,
        configurableResources: configurable,
      });
    }

    return NextResponse.json({
      ...payload,
      configurableResources: adminConfigurable,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load role permissions" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { ctx, response } = await requireWrite("users");
  if (response) return response;

  try {
    const body = await request.json();
    const roles = body.roles as Partial<Record<BuiltInRole, Record<Resource, AccessLevel>>> | undefined;
    if (!roles) {
      return NextResponse.json({ error: "roles object is required" }, { status: 400 });
    }

    const configurable = ctx!.configurableResources;
    const [existing, customRoles] = await Promise.all([
      getRoleAccessDefaults(),
      getCustomRoles(),
    ]);
    const merged: RoleAccessDefaults = { ...(existing ?? {}) };

    for (const role of BUILT_IN_ROLES) {
      if (role === "admin") continue;
      const matrix = roles[role];
      if (!matrix) continue;

      for (const resource of configurable) {
        const level = matrix[resource];
        if (!level || !["none", "read", "write"].includes(level)) {
          return NextResponse.json(
            { error: `Invalid access for ${role}.${resource}` },
            { status: 400 }
          );
        }
      }

      const roleMatrix = { ...getRoleBaseAccess(role, existing, customRoles) };
      for (const resource of configurable) {
        roleMatrix[resource] = matrix[resource];
      }
      merged[role] = roleMatrix;
    }

    await saveRoleAccessDefaults(merged);
    const stored = await getRoleAccessDefaults();
    const adminConfigurable = ctx!.configurableResources;
    const apiPayload = mergeRoleDefaultsForApi(stored, customRoles, adminConfigurable);

    if (!ctx!.isSuperAdmin) {
      const filteredEffective = Object.fromEntries(
        BUILT_IN_ROLES.map((role) => [
          role,
          filterAccessMatrix(apiPayload.effective[role], configurable),
        ])
      ) as Record<BuiltInRole, Record<Resource, AccessLevel>>;
      return NextResponse.json({
        ...apiPayload,
        effective: filteredEffective,
        configurableResources: configurable,
      });
    }

    return NextResponse.json({
      ...apiPayload,
      configurableResources: adminConfigurable,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save role permissions" },
      { status: 500 }
    );
  }
}
