"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type {
  AccessLevel,
  AccessOverride,
  AppRole,
  Resource,
} from "@/lib/permissions";
import { canRead as checkRead, canWrite as checkWrite } from "@/lib/permissions";

interface PermissionsContextValue {
  role: AppRole;
  overrides: AccessOverride[];
  access: Record<Resource, AccessLevel>;
  canRead: (resource: Resource) => boolean;
  canWrite: (resource: Resource) => boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({
  role,
  overrides,
  access,
  children,
}: {
  role: AppRole;
  overrides: AccessOverride[];
  access: Record<Resource, AccessLevel>;
  children: React.ReactNode;
}) {
  const canReadFn = useCallback(
    (resource: Resource) => checkRead(access, resource),
    [access]
  );
  const canWriteFn = useCallback(
    (resource: Resource) => checkWrite(access, resource),
    [access]
  );

  const value = useMemo(
    () => ({
      role,
      overrides,
      access,
      canRead: canReadFn,
      canWrite: canWriteFn,
    }),
    [role, overrides, access, canReadFn, canWriteFn]
  );

  return (
    <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error("usePermissions must be used within PermissionsProvider");
  }
  return ctx;
}
