import { createClient } from "@/lib/supabase/server";
import type {
  BuiltInRole,
  CustomRole,
  Resource,
  AccessLevel,
  RoleAccessDefaults,
} from "@/lib/permissions";
import {
  BUILT_IN_ROLES,
  CUSTOM_ROLE_PREFIX,
  RESOURCES,
  ROLE_ACCESS,
  ROLE_LABELS,
  defaultCustomRoleAccess,
  getRoleBaseAccess,
  isBuiltInRole,
  parseAccessMatrix,
  validateAccessMatrix,
} from "@/lib/permissions";

function parseRoleAccessDefaults(raw: unknown): RoleAccessDefaults | null {
  if (!raw || typeof raw !== "object") return null;
  const result: RoleAccessDefaults = {};
  for (const role of BUILT_IN_ROLES) {
    if (role === "admin") continue;
    const row = (raw as Record<string, unknown>)[role];
    if (!row || typeof row !== "object") continue;
    const access: Record<Resource, AccessLevel> = { ...ROLE_ACCESS[role] };
    let hasCustom = false;
    for (const resource of RESOURCES) {
      const level = (row as Record<string, unknown>)[resource];
      if (level === "none" || level === "read" || level === "write") {
        access[resource] = level;
        if (level !== ROLE_ACCESS[role][resource]) hasCustom = true;
      }
    }
    if (hasCustom) result[role] = access;
  }
  return Object.keys(result).length > 0 ? result : null;
}

function parseCustomRoles(raw: unknown): CustomRole[] {
  if (!Array.isArray(raw)) return [];
  const roles: CustomRole[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    if (!id.startsWith(CUSTOM_ROLE_PREFIX) || !name) continue;
    const access = parseAccessMatrix(row.access);
    if (!access) continue;
    roles.push({
      id,
      name,
      access,
      created_at: typeof row.created_at === "string" ? row.created_at : undefined,
    });
  }
  return roles;
}

export async function getRoleAccessDefaults(): Promise<RoleAccessDefaults | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("org_settings")
    .select("role_access_defaults")
    .eq("id", "default")
    .maybeSingle();
  if (error || !data) return null;
  return parseRoleAccessDefaults(data.role_access_defaults);
}

export async function getCustomRoles(): Promise<CustomRole[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("org_settings")
    .select("custom_roles")
    .eq("id", "default")
    .maybeSingle();
  if (error || !data) return [];
  return parseCustomRoles(data.custom_roles);
}

export async function getOrgRolesContext(): Promise<{
  roleDefaults: RoleAccessDefaults | null;
  customRoles: CustomRole[];
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("org_settings")
    .select("role_access_defaults, custom_roles")
    .eq("id", "default")
    .maybeSingle();
  if (error || !data) {
    return { roleDefaults: null, customRoles: [] };
  }
  return {
    roleDefaults: parseRoleAccessDefaults(data.role_access_defaults),
    customRoles: parseCustomRoles(data.custom_roles),
  };
}

export async function saveRoleAccessDefaults(defaults: RoleAccessDefaults): Promise<void> {
  const supabase = await createClient();
  const payload: RoleAccessDefaults = {};
  for (const role of BUILT_IN_ROLES) {
    if (role === "admin") continue;
    if (defaults[role]) payload[role] = defaults[role]!;
  }
  const { error } = await supabase.from("org_settings").upsert({
    id: "default",
    role_access_defaults: payload,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

async function persistCustomRoles(customRoles: CustomRole[]): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("org_settings").upsert({
    id: "default",
    custom_roles: customRoles,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

function slugifyRoleName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
}

function uniqueCustomRoleId(name: string, existing: CustomRole[]): string {
  const base = slugifyRoleName(name) || "role";
  let candidate = `${CUSTOM_ROLE_PREFIX}${base}`;
  if (!existing.some((role) => role.id === candidate)) return candidate;
  let index = 2;
  while (existing.some((role) => role.id === `${candidate}_${index}`)) {
    index += 1;
  }
  return `${candidate}_${index}`;
}

export async function createCustomRole(
  name: string,
  access?: Record<Resource, AccessLevel>
): Promise<CustomRole> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Role name is required");
  if (trimmed.length > 64) throw new Error("Role name must be 64 characters or fewer");

  const matrix = access ?? defaultCustomRoleAccess();
  if (!validateAccessMatrix(matrix)) {
    throw new Error("Invalid access matrix");
  }

  const existing = await getCustomRoles();
  const role: CustomRole = {
    id: uniqueCustomRoleId(trimmed, existing),
    name: trimmed,
    access: { ...matrix },
    created_at: new Date().toISOString(),
  };
  await persistCustomRoles([...existing, role]);
  return role;
}

export async function updateCustomRole(
  id: string,
  updates: { name?: string; access?: Record<Resource, AccessLevel> }
): Promise<CustomRole> {
  if (!id.startsWith(CUSTOM_ROLE_PREFIX)) {
    throw new Error("Invalid custom role id");
  }

  const existing = await getCustomRoles();
  const index = existing.findIndex((role) => role.id === id);
  if (index < 0) throw new Error("Custom role not found");

  const current = existing[index];
  const name = updates.name !== undefined ? updates.name.trim() : current.name;
  if (!name) throw new Error("Role name is required");
  if (name.length > 64) throw new Error("Role name must be 64 characters or fewer");

  const access = updates.access ?? current.access;
  if (!validateAccessMatrix(access)) {
    throw new Error("Invalid access matrix");
  }

  const updated: CustomRole = { ...current, name, access: { ...access } };
  const next = [...existing];
  next[index] = updated;
  await persistCustomRoles(next);
  return updated;
}

export async function deleteCustomRole(id: string): Promise<void> {
  if (!id.startsWith(CUSTOM_ROLE_PREFIX)) {
    throw new Error("Invalid custom role id");
  }

  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", id);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) {
    throw new Error("Cannot delete a role that is assigned to users. Reassign them first.");
  }

  const existing = await getCustomRoles();
  const next = existing.filter((role) => role.id !== id);
  if (next.length === existing.length) {
    throw new Error("Custom role not found");
  }
  await persistCustomRoles(next);
}

export function mergeRoleDefaultsForApi(
  stored: RoleAccessDefaults | null,
  customRoles: CustomRole[] = []
) {
  const effectiveBuiltIn = Object.fromEntries(
    BUILT_IN_ROLES.map((role) => [role, getRoleBaseAccess(role, stored, customRoles)])
  ) as Record<BuiltInRole, Record<Resource, AccessLevel>>;

  return {
    stored,
    customRoles,
    effective: effectiveBuiltIn,
    builtIn: ROLE_ACCESS,
    assignable: [
      ...BUILT_IN_ROLES.map((role) => ({ id: role, label: ROLE_LABELS[role] })),
      ...customRoles.map((role) => ({ id: role.id, label: role.name })),
    ],
  };
}

export function isValidProfileRole(role: string, customRoles: CustomRole[]): boolean {
  return isBuiltInRole(role) || customRoles.some((item) => item.id === role);
}
