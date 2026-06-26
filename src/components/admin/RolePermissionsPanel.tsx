"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import type {
  AccessLevel,
  BuiltInRole,
  CustomRole,
  Resource,
  RoleAccessDefaults,
} from "@/lib/permissions";
import {
  BUILT_IN_ROLES,
  RESOURCES,
  ROLE_ACCESS,
  ROLE_LABELS,
  RESOURCE_LABELS,
  accessFromCheckboxes,
  checkboxesFromAccess,
  defaultCustomRoleAccess,
  getRoleBaseAccess,
  getRoleLabel,
  isBuiltInRole,
  isCustomRole,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { StyledCheckbox } from "@/components/ui/StyledCheckbox";
import { usePermissions } from "@/lib/permissions-context";

const EDITABLE_BUILT_IN: BuiltInRole[] = ["performance_engineer", "viewer"];

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
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {label}
    </button>
  );
}

export function RolePermissionsPanel() {
  const { isSuperAdmin, configurableResources } = usePermissions();
  const visibleResources = configurableResources;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>(
    "performance_engineer",
  );
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [builtInMatrices, setBuiltInMatrices] = useState<
    Record<BuiltInRole, Record<Resource, AccessLevel>>
  >({
    admin: getRoleBaseAccess("admin"),
    performance_engineer: getRoleBaseAccess("performance_engineer"),
    viewer: getRoleBaseAccess("viewer"),
  });
  const [customDrafts, setCustomDrafts] = useState<
    Record<string, { name: string; access: Record<Resource, AccessLevel> }>
  >({});
  const [creating, setCreating] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [adminVisibility, setAdminVisibility] = useState<Resource[]>([
    ...RESOURCES,
  ]);
  const [visibilitySaving, setVisibilitySaving] = useState(false);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/roles");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to load role permissions");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setBuiltInMatrices({
      admin: data.effective.admin,
      performance_engineer: data.effective.performance_engineer,
      viewer: data.effective.viewer,
    });
    const roles: CustomRole[] = data.customRoles ?? [];
    setCustomRoles(roles);
    setCustomDrafts(
      Object.fromEntries(
        roles.map((role) => [
          role.id,
          { name: role.name, access: { ...role.access } },
        ]),
      ),
    );
    setLoading(false);

    if (isSuperAdmin) {
      const configRes = await fetch("/api/admin/super-admin/config");
      if (configRes.ok) {
        const configData = await configRes.json();
        setAdminVisibility(configData.resources ?? [...RESOURCES]);
      }
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const selectedCustom = isCustomRole(selectedRole)
    ? customDrafts[selectedRole]
    : null;
  const isBuiltIn = isBuiltInRole(selectedRole);
  const isEditableBuiltIn =
    isBuiltIn && EDITABLE_BUILT_IN.includes(selectedRole as BuiltInRole);
  const isEditableCustom = Boolean(selectedCustom);
  const isEditable = isEditableBuiltIn || isEditableCustom;

  function currentMatrix(): Record<Resource, AccessLevel> {
    if (isBuiltIn) return builtInMatrices[selectedRole as BuiltInRole];
    if (selectedCustom) return selectedCustom.access;
    return defaultCustomRoleAccess();
  }

  function setCheckbox(
    resource: Resource,
    kind: "read" | "write",
    checked: boolean,
  ) {
    if (!isEditable) return;

    if (isBuiltIn) {
      setBuiltInMatrices((prev) => {
        const current = checkboxesFromAccess(
          prev[selectedRole as BuiltInRole][resource],
        );
        const next =
          kind === "write"
            ? { read: checked ? true : current.read, write: checked }
            : { read: checked, write: checked ? current.write : false };
        return {
          ...prev,
          [selectedRole]: {
            ...prev[selectedRole as BuiltInRole],
            [resource]: accessFromCheckboxes(next.read, next.write),
          },
        };
      });
      return;
    }

    setCustomDrafts((prev) => {
      const draft = prev[selectedRole];
      if (!draft) return prev;
      const current = checkboxesFromAccess(draft.access[resource]);
      const next =
        kind === "write"
          ? { read: checked ? true : current.read, write: checked }
          : { read: checked, write: checked ? current.write : false };
      return {
        ...prev,
        [selectedRole]: {
          ...draft,
          access: {
            ...draft.access,
            [resource]: accessFromCheckboxes(next.read, next.write),
          },
        },
      };
    });
  }

  function resetBuiltInToDefault() {
    if (!isEditableBuiltIn) return;
    setBuiltInMatrices((prev) => ({
      ...prev,
      [selectedRole]: { ...ROLE_ACCESS[selectedRole as BuiltInRole] },
    }));
  }

  function resetCustomToSaved() {
    const saved = customRoles.find((role) => role.id === selectedRole);
    if (!saved) return;
    setCustomDrafts((prev) => ({
      ...prev,
      [selectedRole]: { name: saved.name, access: { ...saved.access } },
    }));
  }

  async function saveCurrentRole() {
    setSaving(true);
    setError(null);

    if (isEditableBuiltIn) {
      const payload: RoleAccessDefaults = {
        performance_engineer: builtInMatrices.performance_engineer,
        viewer: builtInMatrices.viewer,
      };
      const res = await fetch("/api/admin/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: payload }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save role permissions");
        setSaving(false);
        return;
      }
    } else if (isEditableCustom && selectedCustom) {
      const res = await fetch(`/api/admin/roles/custom/${selectedRole}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedCustom.name,
          access: selectedCustom.access,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save custom role");
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    await loadRoles();
  }

  async function createRole() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/roles/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newRoleName,
        access: defaultCustomRoleAccess(),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create role");
      setSaving(false);
      return;
    }
    const data = await res.json();
    setSaving(false);
    setCreating(false);
    setNewRoleName("");
    await loadRoles();
    if (data.role?.id) setSelectedRole(data.role.id);
  }

  async function deleteCurrentCustomRole() {
    if (!isCustomRole(selectedRole)) return;
    if (!window.confirm("Delete this custom role? This cannot be undone."))
      return;

    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/roles/custom/${selectedRole}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete custom role");
      setSaving(false);
      return;
    }
    setSaving(false);
    setSelectedRole("performance_engineer");
    await loadRoles();
  }

  async function saveAdminVisibility() {
    setVisibilitySaving(true);
    setError(null);
    const res = await fetch("/api/admin/super-admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resources: adminVisibility }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save admin visibility settings");
      setVisibilitySaving(false);
      return;
    }
    setVisibilitySaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleAdminVisibility(resource: Resource) {
    setAdminVisibility((prev) => {
      if (prev.includes(resource)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== resource);
      }
      return [...prev, resource];
    });
  }

  const matrix = currentMatrix();
  const editableResources = isSuperAdmin ? RESOURCES : visibleResources;

  return (
    <div className="w-full space-y-5">
      {isSuperAdmin && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 bg-violet-50/50 px-5 py-4">
            <p className="font-semibold text-slate-900">Admin visibility</p>
            <p className="mt-1 text-sm text-slate-600">
              Choose which resources admins can see when configuring roles and
              user permissions. Hidden resources stay invisible to them.
            </p>
          </div>
          <div className="space-y-2 p-5">
            {RESOURCES.map((resource) => {
              const enabled = adminVisibility.includes(resource);
              return (
                <StyledCheckbox
                  key={resource}
                  variant="row"
                  className="rounded-xl border border-slate-200/80 bg-slate-50/40 px-3 py-2.5"
                  label={RESOURCE_LABELS[resource]}
                  checked={enabled}
                  onChange={() => toggleAdminVisibility(resource)}
                />
              );
            })}
            <button
              type="button"
              onClick={saveAdminVisibility}
              disabled={visibilitySaving || adminVisibility.length === 0}
              className="btn-primary w-full"
            >
              {visibilitySaving ? "Saving…" : "Save admin visibility"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-slate-100 bg-slate-50/50 p-3">
          {BUILT_IN_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => {
                setSelectedRole(role);
                setCreating(false);
              }}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                selectedRole === role && !creating
                  ? "bg-white text-brand-700 shadow-sm ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:bg-white/60",
              )}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
          {customRoles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => {
                setSelectedRole(role.id);
                setCreating(false);
              }}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                selectedRole === role.id && !creating
                  ? "bg-white text-teal-700 shadow-sm ring-1 ring-teal-200/80"
                  : "text-slate-600 hover:bg-white/60",
              )}
            >
              {role.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setNewRoleName("");
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              creating
                ? "bg-brand-600 text-white"
                : "text-brand-600 hover:bg-brand-50",
            )}
          >
            <Plus className="h-4 w-4" />
            New role
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : creating ? (
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Role name
              </label>
              <input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g. QA Lead"
                className="input w-full"
                autoFocus
              />
              <p className="mt-2 text-xs text-slate-500">
                New roles start with viewer-level defaults. Adjust permissions
                after creating.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={createRole}
                disabled={saving || !newRoleName.trim()}
                className="btn-primary flex-1"
              >
                {saving ? "Creating…" : "Create role"}
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : selectedRole === "admin" ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="mt-4 font-semibold text-slate-900">
              Admin has full access
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              The admin role always has write access to all resources and cannot
              be restricted.
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-5">
            {isEditableCustom && selectedCustom && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Role name
                </label>
                <input
                  value={selectedCustom.name}
                  onChange={(e) =>
                    setCustomDrafts((prev) => ({
                      ...prev,
                      [selectedRole]: {
                        ...prev[selectedRole],
                        name: e.target.value,
                      },
                    }))
                  }
                  className="input w-full"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                Default permissions for{" "}
                <strong>{getRoleLabel(selectedRole, customRoles)}</strong>{" "}
                users.
              </p>
              {isEditableBuiltIn && (
                <button
                  type="button"
                  onClick={resetBuiltInToDefault}
                  className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset to built-in
                </button>
              )}
              {isEditableCustom && (
                <button
                  type="button"
                  onClick={resetCustomToSaved}
                  className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Discard changes
                </button>
              )}
            </div>

            <div className="space-y-2">
              {editableResources.map((resource) => {
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
                        disabled={!isEditable}
                        onChange={(checked) =>
                          setCheckbox(resource, "read", checked)
                        }
                      />
                      <AccessToggle
                        label="Write"
                        variant="write"
                        checked={boxes.write}
                        disabled={!isEditable}
                        onChange={(checked) =>
                          setCheckbox(resource, "write", checked)
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveCurrentRole}
                disabled={saving || !isEditable}
                className="btn-primary flex-1"
              >
                {saving
                  ? "Saving…"
                  : saved
                    ? "Saved!"
                    : "Save role permissions"}
              </button>
              {isEditableCustom && (
                <button
                  type="button"
                  onClick={deleteCurrentCustomRole}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
