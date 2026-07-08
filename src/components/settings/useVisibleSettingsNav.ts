"use client";

import { useMemo } from "react";
import { usePermissions } from "@/lib/permissions-context";
import { filterVisibleSettingsNav } from "@/lib/settings/navigation";

export function useVisibleSettingsNav() {
  const { canRead, canWrite } = usePermissions();
  return useMemo(
    () => filterVisibleSettingsNav(canRead, canWrite),
    [canRead, canWrite]
  );
}
