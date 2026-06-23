import { NextResponse } from "next/server";
import { requireWrite } from "@/lib/supabase/get-auth-context";
import {
  createCustomRole,
  getCustomRoles,
  getRoleAccessDefaults,
  mergeRoleDefaultsForApi,
} from "@/lib/role-access-defaults-server";
import type { Resource, AccessLevel } from "@/lib/permissions";
import { defaultCustomRoleAccess, parseAccessMatrix } from "@/lib/permissions";

export async function POST(request: Request) {
  const { ctx, response } = await requireWrite("users");
  if (response) return response;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name : "";
    const parsed = parseAccessMatrix(body.access as Record<Resource, AccessLevel> | undefined);
    const configurable = ctx!.configurableResources;
    const access = { ...(parsed ?? defaultCustomRoleAccess()) };
    if (!ctx!.isSuperAdmin) {
      const defaults = defaultCustomRoleAccess();
      for (const resource of Object.keys(defaults) as Resource[]) {
        if (!configurable.includes(resource)) {
          access[resource] = defaults[resource];
        }
      }
    }

    const role = await createCustomRole(name, access);
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
      { error: err instanceof Error ? err.message : "Failed to create custom role" },
      { status: 400 }
    );
  }
}
