import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isUserSuperAdmin,
  replaceUserAccessOverrides,
  requireWrite,
} from "@/lib/supabase/get-auth-context";
import type { AccessLevel, AccessOverride, Resource } from "@/lib/permissions";
import {
  computeOverridesFromMatrix,
  getEffectiveAccess,
  mergeConfigurableAccess,
  resolveRole,
} from "@/lib/permissions";
import { getOrgRolesContext } from "@/lib/role-access-defaults-server";

function mapOverrides(
  rows: { resource: string; access_level: string }[] | null
): AccessOverride[] {
  if (!rows) return [];
  return rows
    .filter(
      (row): row is { resource: Resource; access_level: AccessLevel } =>
        typeof row.resource === "string" && typeof row.access_level === "string"
    )
    .map((row) => ({
      resource: row.resource as Resource,
      access: row.access_level as AccessLevel,
    }));
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { ctx, response } = await requireWrite("users");
  if (response) return response;

  if (await isUserSuperAdmin(params.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const matrix = body.access as Record<Resource, AccessLevel> | undefined;
  if (!matrix) {
    return NextResponse.json({ error: "access matrix is required" }, { status: 400 });
  }

  const configurable = ctx!.configurableResources;
  for (const resource of configurable) {
    const level = matrix[resource];
    if (!level || !["none", "read", "write"].includes(level)) {
      return NextResponse.json({ error: `Invalid access for ${resource}` }, { status: 400 });
    }
  }

  const supabase = await createClient();
  const { roleDefaults, customRoles } = await getOrgRolesContext();
  const resolvedRole = resolveRole(body.role as string, customRoles);

  const { data: overrideRows } = await supabase
    .from("user_access_overrides")
    .select("resource, access_level")
    .eq("user_id", params.id);
  const existingOverrides = mapOverrides(overrideRows);

  const currentEffective = getEffectiveAccess(
    resolvedRole,
    existingOverrides,
    roleDefaults,
    customRoles
  );
  const mergedMatrix = mergeConfigurableAccess(currentEffective, matrix, configurable);

  if (params.id === ctx!.userId && mergedMatrix.users !== "write") {
    return NextResponse.json(
      { error: "You cannot remove your own user management access." },
      { status: 400 }
    );
  }

  const overrides = computeOverridesFromMatrix(
    resolvedRole,
    mergedMatrix,
    roleDefaults,
    customRoles
  );

  try {
    await replaceUserAccessOverrides(params.id, overrides, ctx!.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update access" },
      { status: 500 }
    );
  }
}
