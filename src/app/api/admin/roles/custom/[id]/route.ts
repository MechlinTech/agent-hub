import { NextResponse } from "next/server";
import { requireWrite } from "@/lib/supabase/get-auth-context";
import {
  deleteCustomRole,
  getCustomRoles,
  getRoleAccessDefaults,
  mergeRoleDefaultsForApi,
  updateCustomRole,
} from "@/lib/role-access-defaults-server";
import type { Resource, AccessLevel } from "@/lib/permissions";
import { parseAccessMatrix } from "@/lib/permissions";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { ctx, response } = await requireWrite("users");
  if (response) return response;

  try {
    const body = await request.json();
    const updates: { name?: string; access?: Record<Resource, AccessLevel> } = {};
    if (typeof body.name === "string") updates.name = body.name;

    const parsed = parseAccessMatrix(body.access);
    if (parsed) {
      const existingRoles = await getCustomRoles();
      const current = existingRoles.find((role) => role.id === params.id);
      if (!current) {
        return NextResponse.json({ error: "Custom role not found" }, { status: 404 });
      }

      const configurable = ctx!.configurableResources;
      const access = { ...current.access };
      if (ctx!.isSuperAdmin) {
        Object.assign(access, parsed);
      } else {
        for (const resource of configurable) {
          access[resource] = parsed[resource];
        }
      }
      updates.access = access;
    }

    const role = await updateCustomRole(params.id, updates);
    const [stored, customRoles] = await Promise.all([
      getRoleAccessDefaults(),
      getCustomRoles(),
    ]);
    return NextResponse.json({
      role,
      ...mergeRoleDefaultsForApi(stored, customRoles, ctx!.configurableResources),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update custom role" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { ctx, response } = await requireWrite("users");
  if (response) return response;

  try {
    await deleteCustomRole(params.id);
    const [stored, customRoles] = await Promise.all([
      getRoleAccessDefaults(),
      getCustomRoles(),
    ]);
    return NextResponse.json(
      mergeRoleDefaultsForApi(stored, customRoles, ctx!.configurableResources)
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete custom role" },
      { status: 400 }
    );
  }
}
