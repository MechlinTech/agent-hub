export type BuiltInRole = "admin" | "performance_engineer" | "viewer";

/** Built-in role id or custom role id (custom_*). */
export type AppRole = BuiltInRole | string;

export type AccessLevel = "none" | "read" | "write";

export type Resource =
  | "script_review"
  | "results_analysis"
  | "project_setup"
  | "integrations"
  | "settings"
  | "users";

export type AccessOverride = { resource: Resource; access: AccessLevel };

export interface CustomRole {
  id: string;
  name: string;
  access: Record<Resource, AccessLevel>;
  created_at?: string;
}

export const CUSTOM_ROLE_PREFIX = "custom_";

export const RESOURCES: Resource[] = [
  "script_review",
  "results_analysis",
  "project_setup",
  "integrations",
  "settings",
  "users",
];

export const BUILT_IN_ROLES: BuiltInRole[] = ["admin", "performance_engineer", "viewer"];

/** @deprecated Use BUILT_IN_ROLES for built-in roles only. */
export const APP_ROLES: BuiltInRole[] = BUILT_IN_ROLES;

export const ROLE_LABELS: Record<BuiltInRole, string> = {
  admin: "Admin",
  performance_engineer: "Performance Engineer",
  viewer: "Viewer",
};

export const RESOURCE_LABELS: Record<Resource, string> = {
  script_review: "Script Review Agent",
  results_analysis: "Results Analysis Agent",
  project_setup: "Project Setup Agent",
  integrations: "Integrations",
  settings: "Settings",
  users: "User Management",
};

export const RESOURCE_SHORT_LABELS: Record<Resource, string> = {
  script_review: "SR",
  results_analysis: "RA",
  project_setup: "PS",
  integrations: "INT",
  settings: "SET",
  users: "USR",
};

export const ROLE_ACCESS: Record<BuiltInRole, Record<Resource, AccessLevel>> = {
  admin: {
    script_review: "write",
    results_analysis: "write",
    project_setup: "write",
    integrations: "write",
    settings: "write",
    users: "write",
  },
  performance_engineer: {
    script_review: "write",
    results_analysis: "write",
    project_setup: "write",
    integrations: "none",
    settings: "write",
    users: "none",
  },
  viewer: {
    script_review: "read",
    results_analysis: "read",
    project_setup: "read",
    integrations: "none",
    settings: "read",
    users: "none",
  },
};

export const AGENT_RESOURCE_MAP: Record<string, Resource> = {
  "script-review": "script_review",
  "results-analysis": "results_analysis",
  "project-setup": "project_setup",
};

export const ALL_WRITE: Record<Resource, AccessLevel> = {
  script_review: "write",
  results_analysis: "write",
  project_setup: "write",
  integrations: "write",
  settings: "write",
  users: "write",
};

/** Resources admins may configure for other users (null/empty = all resources). */
export function getConfigurableResources(
  adminConfigurable: Resource[] | null | undefined,
  isSuperAdmin: boolean
): Resource[] {
  if (isSuperAdmin) return [...RESOURCES];
  if (!adminConfigurable || adminConfigurable.length === 0) return [...RESOURCES];
  return RESOURCES.filter((resource) => adminConfigurable.includes(resource));
}

export function parseConfigurableResources(raw: unknown): Resource[] | null {
  if (!Array.isArray(raw)) return null;
  const resources = raw.filter(
    (item): item is Resource =>
      typeof item === "string" && RESOURCES.includes(item as Resource)
  );
  return resources.length > 0 ? resources : null;
}

/** Strip non-configurable resources from a matrix for admin API responses. */
export function filterAccessMatrix(
  matrix: Record<Resource, AccessLevel>,
  configurable: Resource[]
): Record<Resource, AccessLevel> {
  const filtered = { ...matrix };
  for (const resource of RESOURCES) {
    if (!configurable.includes(resource)) {
      delete filtered[resource];
    }
  }
  return filtered;
}

/** Merge admin-edited resources into the user's full effective access. */
export function mergeConfigurableAccess(
  fullEffective: Record<Resource, AccessLevel>,
  edited: Record<Resource, AccessLevel>,
  configurable: Resource[]
): Record<Resource, AccessLevel> {
  const merged = { ...fullEffective };
  for (const resource of configurable) {
    if (edited[resource] !== undefined) {
      merged[resource] = edited[resource];
    }
  }
  return merged;
}

export function filterOverridesForConfigurable(
  overrides: AccessOverride[],
  configurable: Resource[]
): AccessOverride[] {
  return overrides.filter((override) => configurable.includes(override.resource));
}

export function isBuiltInRole(role: string | null | undefined): role is BuiltInRole {
  return role === "admin" || role === "performance_engineer" || role === "viewer";
}

export function isAdminRole(role: string): boolean {
  return role === "admin";
}

export function isCustomRole(role: string): boolean {
  return role.startsWith(CUSTOM_ROLE_PREFIX);
}

export function resolveRole(
  raw: string | null | undefined,
  customRoles?: CustomRole[] | null
): AppRole {
  if (isBuiltInRole(raw)) return raw;
  if (raw && customRoles?.some((role) => role.id === raw)) return raw;
  return "performance_engineer";
}

export function getRoleLabel(role: string, customRoles?: CustomRole[] | null): string {
  if (isBuiltInRole(role)) return ROLE_LABELS[role];
  return customRoles?.find((item) => item.id === role)?.name ?? role;
}

export function listAssignableRoles(customRoles: CustomRole[] = []) {
  return [
    ...BUILT_IN_ROLES.map((role) => ({ id: role as string, label: ROLE_LABELS[role] })),
    ...customRoles.map((role) => ({ id: role.id, label: role.name })),
  ];
}

export function isAssignableRole(role: string, customRoles: CustomRole[] = []): boolean {
  if (isBuiltInRole(role)) return true;
  return customRoles.some((item) => item.id === role);
}

export function defaultCustomRoleAccess(): Record<Resource, AccessLevel> {
  return { ...ROLE_ACCESS.viewer };
}

export type RoleAccessDefaults = Partial<Record<BuiltInRole, Record<Resource, AccessLevel>>>;

export function getRoleBaseAccess(
  role: AppRole,
  roleDefaults?: RoleAccessDefaults | null,
  customRoles?: CustomRole[] | null
): Record<Resource, AccessLevel> {
  if (isAdminRole(role)) {
    return { ...ALL_WRITE };
  }
  if (isCustomRole(role)) {
    const custom = customRoles?.find((item) => item.id === role);
    if (custom) return { ...custom.access };
    return { ...ROLE_ACCESS.viewer };
  }
  const custom = roleDefaults?.[role as BuiltInRole];
  if (custom) {
    return { ...ROLE_ACCESS[role as BuiltInRole], ...custom };
  }
  return { ...ROLE_ACCESS[role as BuiltInRole] };
}

export function getEffectiveAccess(
  role: AppRole,
  overrides: AccessOverride[] = [],
  roleDefaults?: RoleAccessDefaults | null,
  customRoles?: CustomRole[] | null
): Record<Resource, AccessLevel> {
  const access = getRoleBaseAccess(role, roleDefaults, customRoles);
  for (const { resource, access: level } of overrides) {
    if (RESOURCES.includes(resource)) {
      access[resource] = level;
    }
  }
  return access;
}

/**
 * Non-super-admin users with the built-in admin role only get app access to resources
 * enabled in admin_configurable_resources (null/empty = all resources).
 */
export function applyAdminResourceScope(
  access: Record<Resource, AccessLevel>,
  role: AppRole,
  isSuperAdmin: boolean,
  adminConfigurable: Resource[] | null | undefined
): Record<Resource, AccessLevel> {
  if (isSuperAdmin || !isAdminRole(role)) return access;
  const allowed =
    adminConfigurable && adminConfigurable.length > 0 ? adminConfigurable : [...RESOURCES];
  const scoped = { ...access };
  for (const resource of RESOURCES) {
    if (!allowed.includes(resource)) {
      scoped[resource] = "none";
    }
  }
  return scoped;
}

export function canRead(
  access: Record<Resource, AccessLevel>,
  resource: Resource
): boolean {
  const level = access[resource];
  return level === "read" || level === "write";
}

export function canWrite(
  access: Record<Resource, AccessLevel>,
  resource: Resource
): boolean {
  return access[resource] === "write";
}

export function accessFromCheckboxes(read: boolean, write: boolean): AccessLevel {
  if (write) return "write";
  if (read) return "read";
  return "none";
}

export function checkboxesFromAccess(level: AccessLevel): {
  read: boolean;
  write: boolean;
} {
  return {
    read: level === "read" || level === "write",
    write: level === "write",
  };
}

/** Overrides that differ from the role default (for storage). */
export function computeOverridesFromMatrix(
  role: AppRole,
  matrix: Record<Resource, AccessLevel>,
  roleDefaults?: RoleAccessDefaults | null,
  customRoles?: CustomRole[] | null
): AccessOverride[] {
  const defaults = getRoleBaseAccess(role, roleDefaults, customRoles);
  return RESOURCES.filter((resource) => matrix[resource] !== defaults[resource]).map(
    (resource) => ({ resource, access: matrix[resource] })
  );
}

/** Build full matrix from role + stored overrides. */
export function buildAccessMatrix(
  role: AppRole,
  overrides: AccessOverride[] = [],
  roleDefaults?: RoleAccessDefaults | null,
  customRoles?: CustomRole[] | null
): Record<Resource, AccessLevel> {
  return getEffectiveAccess(role, overrides, roleDefaults, customRoles);
}

export function formatAccessSummary(
  access: Record<Resource, AccessLevel>,
  configurable?: Resource[]
): string {
  const resources = configurable ?? RESOURCES;
  return resources.map((resource) => {
    const level = access[resource];
    const abbrev = level === "write" ? "W" : level === "read" ? "R" : "-";
    return `${RESOURCE_SHORT_LABELS[resource]}:${abbrev}`;
  }).join(" ");
}

export function accessLevelAbbrev(level: AccessLevel): string {
  if (level === "write") return "W";
  if (level === "read") return "R";
  return "-";
}

export function parseAccessMatrix(raw: unknown): Record<Resource, AccessLevel> | null {
  if (!raw || typeof raw !== "object") return null;
  const matrix = { ...defaultCustomRoleAccess() };
  for (const resource of RESOURCES) {
    const level = (raw as Record<string, unknown>)[resource];
    if (level === "none" || level === "read" || level === "write") {
      matrix[resource] = level;
    }
  }
  return matrix;
}

export function validateAccessMatrix(matrix: Record<Resource, AccessLevel>): boolean {
  return RESOURCES.every((resource) =>
    ["none", "read", "write"].includes(matrix[resource])
  );
}
