"use client";

import type { Resource } from "@/lib/permissions";
import { usePermissions } from "@/lib/permissions-context";

export function WriteGate({
  resource,
  children,
  fallback = null,
}: {
  resource: Resource;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { canWrite } = usePermissions();
  if (!canWrite(resource)) return <>{fallback}</>;
  return <>{children}</>;
}
