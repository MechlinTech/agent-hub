import { NextResponse } from "next/server";
import {
  listAllUsersForAdmin,
  requireRead,
} from "@/lib/supabase/get-auth-context";
import { getOrgRolesContext } from "@/lib/role-access-defaults-server";
import {
  filterAccessMatrix,
  filterOverridesForConfigurable,
  formatAccessSummary,
  getEffectiveAccess,
} from "@/lib/permissions";

export async function GET() {
  const { ctx, response } = await requireRead("users");
  if (response) return response;

  try {
    const { roleDefaults, customRoles } = await getOrgRolesContext();
    const users = await listAllUsersForAdmin(customRoles);
    const configurable = ctx!.configurableResources;

    return NextResponse.json({
      users: users.map((user) => {
        const effective = getEffectiveAccess(
          user.role,
          user.access_overrides,
          roleDefaults,
          customRoles
        );
        const filteredOverrides = filterOverridesForConfigurable(
          user.access_overrides,
          configurable
        );
        return {
          ...user,
          access_overrides: filteredOverrides,
          access_summary: formatAccessSummary(
            filterAccessMatrix(effective, configurable),
            configurable
          ),
        };
      }),
      configurableResources: configurable,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list users" },
      { status: 500 }
    );
  }
}
