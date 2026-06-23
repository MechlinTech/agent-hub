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
  const { response } = await requireWrite("users");
  if (response) return response;

  try {
    const body = await request.json();
    const updates: { name?: string; access?: Record<Resource, AccessLevel> } = {};
    if (typeof body.name === "string") updates.name = body.name;
    const access = parseAccessMatrix(body.access);
    if (access) updates.access = access;

    const role = await updateCustomRole(params.id, updates);
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
      { error: err instanceof Error ? err.message : "Failed to update custom role" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { response } = await requireWrite("users");
  if (response) return response;

  try {
    await deleteCustomRole(params.id);
    const [stored, customRoles] = await Promise.all([
      getRoleAccessDefaults(),
      getCustomRoles(),
    ]);
    return NextResponse.json(mergeRoleDefaultsForApi(stored, customRoles));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete custom role" },
      { status: 400 }
    );
  }
}
