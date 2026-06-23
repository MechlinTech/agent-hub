import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AccessOverride, AppRole, Resource } from "@/lib/permissions";
import type { AccessLevel } from "@/lib/permissions";
import {
  ALL_WRITE,
  canRead,
  canWrite,
  applyAdminResourceScope,
  getConfigurableResources,
  getEffectiveAccess,
  resolveRole,
} from "@/lib/permissions";
import {
  getAdminConfigurableResources,
  getOrgRolesContext,
} from "@/lib/role-access-defaults-server";

export interface AuthContext {
  userId: string;
  email: string;
  fullName: string;
  role: AppRole;
  isSuperAdmin: boolean;
  overrides: AccessOverride[];
  access: Record<Resource, AccessLevel>;
  configurableResources: Resource[];
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

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

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: superAdminRow }, { data: overrideRows }, adminConfigurable] =
    await Promise.all([
      supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle(),
      supabase.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("user_access_overrides")
        .select("resource, access_level")
        .eq("user_id", user.id),
      getAdminConfigurableResources(),
    ]);

  const isSuperAdmin = Boolean(superAdminRow);
  const { roleDefaults, customRoles } = await getOrgRolesContext();
  const role = resolveRole(profile?.role, customRoles);
  const overrides = mapOverrides(overrideRows);
  const access = isSuperAdmin
    ? { ...ALL_WRITE }
    : applyAdminResourceScope(
        getEffectiveAccess(role, overrides, roleDefaults, customRoles),
        role,
        false,
        adminConfigurable
      );
  const configurableResources = getConfigurableResources(adminConfigurable, isSuperAdmin);

  return {
    userId: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? user.email?.split("@")[0] ?? "",
    role,
    isSuperAdmin,
    overrides,
    access,
    configurableResources,
  };
}

export async function requireSuperAdmin() {
  const ctx = await getAuthContext();
  if (!ctx) return { ctx: null, response: unauthorizedResponse() };
  if (!ctx.isSuperAdmin) return { ctx: null, response: forbiddenResponse() };
  return { ctx, response: null };
}

export async function requireRead(resource: Resource) {
  const ctx = await getAuthContext();
  if (!ctx) return { ctx: null, response: unauthorizedResponse() };
  if (!canRead(ctx.access, resource)) {
    return { ctx: null, response: forbiddenResponse() };
  }
  return { ctx, response: null };
}

export async function requireWrite(resource: Resource) {
  const ctx = await getAuthContext();
  if (!ctx) return { ctx: null, response: unauthorizedResponse() };
  if (!canWrite(ctx.access, resource)) {
    return { ctx: null, response: forbiddenResponse() };
  }
  return { ctx, response: null };
}

/** Whether the user is listed in super_admins (regardless of profiles). */
export async function isUserSuperAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("super_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function listAllUsersForAdmin(
  customRoles?: import("@/lib/permissions").CustomRole[]
) {
  const supabase = await createClient();
  const resolvedCustomRoles =
    customRoles ?? (await getOrgRolesContext()).customRoles;
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, team_name, role, created_at, updated_at")
    .order("full_name");

  if (error) throw new Error(error.message);

  const users = profiles ?? [];
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return [];

  const { data: overrideRows, error: overrideError } = await supabase
    .from("user_access_overrides")
    .select("user_id, resource, access_level")
    .in("user_id", ids);

  if (overrideError) throw new Error(overrideError.message);

  const overridesByUser = new Map<string, AccessOverride[]>();
  for (const row of overrideRows ?? []) {
    const list = overridesByUser.get(row.user_id) ?? [];
    list.push({
      resource: row.resource as Resource,
      access: row.access_level as AccessLevel,
    });
    overridesByUser.set(row.user_id, list);
  }

  return users.map((profile) => ({
    id: profile.id,
    email: profile.email ?? "",
    full_name: profile.full_name ?? "",
    team_name: profile.team_name ?? "",
    role: resolveRole(profile.role, resolvedCustomRoles),
    access_overrides: overridesByUser.get(profile.id) ?? [],
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  }));
}

export async function updateUserRole(userId: string, role: AppRole) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function replaceUserAccessOverrides(
  userId: string,
  overrides: AccessOverride[],
  updatedBy: string
) {
  const supabase = await createClient();
  const { error: deleteError } = await supabase
    .from("user_access_overrides")
    .delete()
    .eq("user_id", userId);
  if (deleteError) throw new Error(deleteError.message);

  if (overrides.length === 0) return;

  const { error: insertError } = await supabase.from("user_access_overrides").insert(
    overrides.map((override) => ({
      user_id: userId,
      resource: override.resource,
      access_level: override.access,
      updated_by: updatedBy,
    }))
  );
  if (insertError) throw new Error(insertError.message);
}
