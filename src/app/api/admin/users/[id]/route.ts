import { NextResponse } from "next/server";
import {
  requireWrite,
  updateUserRole,
} from "@/lib/supabase/get-auth-context";
import { getCustomRoles, isValidProfileRole } from "@/lib/role-access-defaults-server";
import { isAdminRole, resolveRole } from "@/lib/permissions";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { ctx, response } = await requireWrite("users");
  if (response) return response;

  const body = await request.json();
  const customRoles = await getCustomRoles();
  const role = resolveRole(body.role as string, customRoles);
  if (!isValidProfileRole(role, customRoles)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (params.id === ctx!.userId && isAdminRole(ctx!.role) && !isAdminRole(role)) {
    return NextResponse.json(
      { error: "You cannot remove your own admin access." },
      { status: 400 }
    );
  }

  try {
    await updateUserRole(params.id, role);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update role" },
      { status: 500 }
    );
  }
}
