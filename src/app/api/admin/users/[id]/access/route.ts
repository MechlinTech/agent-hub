import { NextResponse } from "next/server";
import {
  replaceUserAccessOverrides,
  requireWrite,
} from "@/lib/supabase/get-auth-context";
import type { AccessLevel, Resource } from "@/lib/permissions";
import {
  RESOURCES,
  computeOverridesFromMatrix,
  resolveRole,
} from "@/lib/permissions";
import { getOrgRolesContext } from "@/lib/role-access-defaults-server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { ctx, response } = await requireWrite("users");
  if (response) return response;

  const body = await request.json();
  const matrix = body.access as Record<Resource, AccessLevel> | undefined;
  if (!matrix) {
    return NextResponse.json({ error: "access matrix is required" }, { status: 400 });
  }

  for (const resource of RESOURCES) {
    const level = matrix[resource];
    if (!level || !["none", "read", "write"].includes(level)) {
      return NextResponse.json({ error: `Invalid access for ${resource}` }, { status: 400 });
    }
  }

  if (params.id === ctx!.userId && matrix.users !== "write") {
    return NextResponse.json(
      { error: "You cannot remove your own user management access." },
      { status: 400 }
    );
  }

  const { roleDefaults, customRoles } = await getOrgRolesContext();
  const resolvedRole = resolveRole(body.role as string, customRoles);
  const overrides = computeOverridesFromMatrix(resolvedRole, matrix, roleDefaults, customRoles);

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
