import { NextResponse } from "next/server";
import {
  listAllUsersForAdmin,
  requireRead,
} from "@/lib/supabase/get-auth-context";
import { getOrgRolesContext } from "@/lib/role-access-defaults-server";
import { formatAccessSummary, getEffectiveAccess } from "@/lib/permissions";

export async function GET() {
  const { response } = await requireRead("users");
  if (response) return response;

  try {
    const { roleDefaults, customRoles } = await getOrgRolesContext();
    const users = await listAllUsersForAdmin(customRoles);
    return NextResponse.json({
      users: users.map((user) => ({
        ...user,
        access_summary: formatAccessSummary(
          getEffectiveAccess(user.role, user.access_overrides, roleDefaults, customRoles)
        ),
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list users" },
      { status: 500 }
    );
  }
}
