"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Shield, ShieldCheck, UserCircle2, Users, X } from "lucide-react";
import { usePermissions } from "@/lib/permissions-context";
import type { AccessLevel, AppRole, CustomRole, Resource, RoleAccessDefaults } from "@/lib/permissions";
import {
  RESOURCES,
  RESOURCE_LABELS,
  accessFromCheckboxes,
  buildAccessMatrix,
  checkboxesFromAccess,
  computeOverridesFromMatrix,
  getEffectiveAccess,
  getRoleBaseAccess,
  getRoleLabel,
  isBuiltInRole,
  listAssignableRoles,
  resolveRole,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { StyledSelect } from "@/components/ui/StyledSelect";

interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  team_name: string;
  role: AppRole;
  access_overrides?: { resource: Resource; access: AccessLevel }[];
}

const RESOURCE_BADGE_LABELS: Record<Resource, string> = {
  script_review: "Scripts",
  results_analysis: "Results",
  project_setup: "Project Setup",
  integrations: "Integrations",
  settings: "Settings",
  users: "Users",
};

const BUILT_IN_ROLE_STYLES = {
  admin: "bg-violet-50 text-violet-700 ring-violet-200/80",
  performance_engineer: "bg-brand-50 text-brand-700 ring-brand-200/80",
  viewer: "bg-slate-100 text-slate-600 ring-slate-200/80",
} as const;

function roleBadgeStyle(role: string) {
  if (isBuiltInRole(role)) return BUILT_IN_ROLE_STYLES[role];
  return "bg-teal-50 text-teal-700 ring-teal-200/80";
}

const ACCESS_STYLES: Record<AccessLevel, string> = {
  write: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  read: "bg-sky-50 text-sky-700 ring-sky-200/60",
  none: "bg-slate-50 text-slate-400 ring-slate-200/60",
};

const ACCESS_LABELS: Record<AccessLevel, string> = {
  write: "Write",
  read: "Read",
  none: "None",
};

function userInitials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function RoleBadge({ role, customRoles }: { role: AppRole; customRoles: CustomRole[] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        roleBadgeStyle(role)
      )}
    >
      {getRoleLabel(role, customRoles)}
    </span>
  );
}

function AccessLevelPill({ level }: { level: AccessLevel }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        ACCESS_STYLES[level]
      )}
    >
      {ACCESS_LABELS[level]}
    </span>
  );
}

function ResourceAccessBadges({
  access,
  resources = RESOURCES,
}: {
  access: Record<Resource, AccessLevel>;
  resources?: Resource[];
}) {
  const visible = resources.filter((resource) => access[resource] !== "none");

  if (visible.length === 0) {
    return <span className="text-xs text-slate-400">No resource access</span>;
  }

  const allWrite =
    visible.length === resources.length &&
    visible.reduce((ok, resource) => ok && access[resource] === "write", true);

  if (allWrite) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200/60">
        <ShieldCheck className="h-3.5 w-3.5" />
        Full access
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((resource) => (
        <span
          key={resource}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs ring-1 ring-inset",
            ACCESS_STYLES[access[resource]]
          )}
        >
          <span className="font-medium">{RESOURCE_BADGE_LABELS[resource]}</span>
          <AccessLevelPill level={access[resource]} />
        </span>
      ))}
    </div>
  );
}

function AccessToggle({
  label,
  checked,
  disabled,
  onChange,
  variant,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  variant: "read" | "write";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
        checked
          ? variant === "write"
            ? "bg-emerald-600 text-white shadow-sm"
            : "bg-sky-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {label}
    </button>
  );
}

export function UsersAdminPanel({ currentUserId }: { currentUserId: string }) {
  const { canWrite, configurableResources } = usePermissions();
  const visibleResources = configurableResources;
  const canEdit = canWrite("users");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<AppRole>("performance_engineer");
  const [matrix, setMatrix] = useState<Record<Resource, AccessLevel>>(
    buildAccessMatrix("performance_engineer")
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [roleDefaults, setRoleDefaults] = useState<RoleAccessDefaults | null>(null);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const assignableRoles = useMemo(
    () => listAssignableRoles(customRoles),
    [customRoles]
  );

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedId) ?? null,
    [users, selectedId]
  );

  const effectivePreview = useMemo(
    () =>
      getEffectiveAccess(
        editRole,
        computeOverridesFromMatrix(editRole, matrix, roleDefaults, customRoles),
        roleDefaults,
        customRoles
      ),
    [editRole, matrix, roleDefaults, customRoles]
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [usersRes, rolesRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/roles"),
    ]);
    if (!usersRes.ok) {
      const data = await usersRes.json().catch(() => ({}));
      setError(data.error ?? "Failed to load users");
      setLoading(false);
      return;
    }
    const usersData = await usersRes.json();
    setUsers(usersData.users ?? []);
    if (rolesRes.ok) {
      const rolesData = await rolesRes.json();
      setRoleDefaults(rolesData.stored ?? null);
      setCustomRoles(rolesData.customRoles ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function openEditor(user: AdminUserRow) {
    setSelectedId(user.id);
    setEditRole(resolveRole(user.role, customRoles));
    setMatrix(buildAccessMatrix(user.role, user.access_overrides ?? [], roleDefaults, customRoles));
    setSaved(false);
    setError(null);
  }

  function closeEditor() {
    setSelectedId(null);
    setSaved(false);
    setError(null);
  }

  function setCheckbox(resource: Resource, kind: "read" | "write", checked: boolean) {
    setMatrix((prev) => {
      const current = checkboxesFromAccess(prev[resource]);
      const next =
        kind === "write"
          ? { read: checked ? true : current.read, write: checked }
          : { read: checked, write: checked ? current.write : false };
      return { ...prev, [resource]: accessFromCheckboxes(next.read, next.write) };
    });
  }

  function resetToRoleDefaults() {
    setMatrix({ ...getRoleBaseAccess(editRole, roleDefaults, customRoles) });
  }

  async function saveUser() {
    if (!selectedUser || !canEdit) return;
    setSaving(true);
    setError(null);

    const roleRes = await fetch(`/api/admin/users/${selectedUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: editRole }),
    });
    if (!roleRes.ok) {
      const data = await roleRes.json().catch(() => ({}));
      setError(data.error ?? "Failed to update role");
      setSaving(false);
      return;
    }

    const accessRes = await fetch(`/api/admin/users/${selectedUser.id}/access`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: editRole, access: matrix }),
    });
    if (!accessRes.ok) {
      const data = await accessRes.json().catch(() => ({}));
      setError(data.error ?? "Failed to update access");
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    await loadUsers();
  }

  return (
    <div className="w-full space-y-5">
      <div className="flex justify-end">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none text-slate-900">{users.length}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {users.length === 1 ? "User" : "Users"} in workspace
            </p>
          </div>
        </div>
      </div>
      {!canEdit && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Shield className="h-4 w-4 shrink-0" />
          You have read-only access to user management.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="section-title">Team members</h2>
            <p className="section-subtitle">Select a user to review or edit their permissions.</p>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <UserCircle2 className="h-12 w-12 text-slate-300" />
              <p className="mt-4 font-medium text-slate-800">No users found</p>
              <p className="mt-1 text-sm text-slate-500">Users will appear here once they sign up.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {users.map((user) => {
                const access = getEffectiveAccess(
                  user.role,
                  user.access_overrides ?? [],
                  roleDefaults,
                  customRoles
                );
                const isSelected = selectedId === user.id;
                const isSelf = user.id === currentUserId;
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => openEditor(user)}
                      className={cn(
                        "flex w-full items-start gap-4 px-5 py-4 text-left transition-colors",
                        isSelected
                          ? "bg-brand-50/60"
                          : "hover:bg-slate-50/80"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                          isSelected
                            ? "bg-brand-600 text-white"
                            : "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600"
                        )}
                      >
                        {userInitials(user.full_name, user.email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {user.full_name || user.email}
                          </p>
                          {isSelf && (
                            <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                              You
                            </span>
                          )}
                          <RoleBadge role={user.role} customRoles={customRoles} />
                        </div>
                        <p className="mt-0.5 truncate text-sm text-slate-500">{user.email}</p>
                        {user.team_name && (
                          <p className="mt-0.5 text-xs text-slate-400">{user.team_name}</p>
                        )}
                        <div className="mt-3">
                          <ResourceAccessBadges
                            access={access}
                            resources={visibleResources}
                          />
                        </div>
                      </div>
                      <span className="btn-secondary mt-1 hidden shrink-0 px-3 py-1.5 text-xs sm:inline-flex">
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        {canEdit ? "Edit" : "View"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          {selectedUser ? (
            <div className="card overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                      {userInitials(selectedUser.full_name, selectedUser.email)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-slate-900">
                        {selectedUser.full_name || selectedUser.email}
                      </h2>
                      <p className="truncate text-sm text-slate-500">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeEditor}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
                    aria-label="Close editor"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
                  <StyledSelect
                    value={editRole}
                    disabled={!canEdit}
                    onChange={(roleId) => {
                      const role = resolveRole(roleId, customRoles);
                      setEditRole(role);
                      setMatrix({ ...getRoleBaseAccess(role, roleDefaults, customRoles) });
                    }}
                    options={assignableRoles.map((role) => ({
                      value: role.id,
                      label: role.label,
                    }))}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Role sets default permissions. Customize individual resources below.
                  </p>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">Resource permissions</p>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={resetToRoleDefaults}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Reset defaults
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {visibleResources.map((resource) => {
                      const boxes = checkboxesFromAccess(matrix[resource]);
                      return (
                        <div
                          key={resource}
                          className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-3"
                        >
                          <p className="mb-2.5 text-sm font-medium text-slate-800">
                            {RESOURCE_LABELS[resource]}
                          </p>
                          <div className="flex gap-2">
                            <AccessToggle
                              label="Read"
                              variant="read"
                              checked={boxes.read}
                              disabled={!canEdit}
                              onChange={(checked) => setCheckbox(resource, "read", checked)}
                            />
                            <AccessToggle
                              label="Write"
                              variant="write"
                              checked={boxes.write}
                              disabled={!canEdit}
                              onChange={(checked) => setCheckbox(resource, "write", checked)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Effective access
                  </p>
                  <ResourceAccessBadges
                    access={effectivePreview}
                    resources={visibleResources}
                  />
                </div>

                {selectedUser.id === currentUserId &&
                  visibleResources.includes("users") &&
                  matrix.users !== "write" && (
                  <p className="text-xs text-amber-700">
                    You cannot remove your own user management write access.
                  </p>
                )}

                {canEdit && (
                  <button
                    type="button"
                    onClick={saveUser}
                    disabled={
                      saving ||
                      (selectedUser.id === currentUserId &&
                        visibleResources.includes("users") &&
                        matrix.users !== "write")
                    }
                    className="btn-primary w-full"
                  >
                    {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Shield className="h-7 w-7" />
              </div>
              <p className="mt-4 font-semibold text-slate-800">Select a user</p>
              <p className="mt-1 max-w-[240px] text-sm text-slate-500">
                Choose a team member from the list to view or edit their access settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}