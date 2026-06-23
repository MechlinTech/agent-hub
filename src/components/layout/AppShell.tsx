"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { AccessLevel, AccessOverride, AppRole, Resource } from "@/lib/permissions";
import { PermissionsProvider } from "@/lib/permissions-context";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { MobileAgentNav } from "./MobileAgentNav";
import { MobileSettingsNav } from "@/components/settings/MobileSettingsNav";
import { isSettingsPath } from "@/lib/settings/navigation";
import { usePathname } from "next/navigation";

export function AppShell({
  children,
  user,
  profile,
  role,
  isSuperAdmin,
  overrides,
  access,
  configurableResources,
}: {
  children: React.ReactNode;
  user: User;
  profile?: { full_name?: string; team_name?: string } | null;
  role: AppRole;
  isSuperAdmin: boolean;
  overrides: AccessOverride[];
  access: Record<Resource, AccessLevel>;
  configurableResources: Resource[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const showSettingsMobileNav = isSettingsPath(pathname);

  return (
    <PermissionsProvider
      role={role}
      isSuperAdmin={isSuperAdmin}
      overrides={overrides}
      access={access}
      configurableResources={configurableResources}
    >
      <div className="flex h-[100dvh] overflow-hidden app-shell-bg">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar user={user} profile={profile} role={role} />
          {showSettingsMobileNav ? <MobileSettingsNav /> : <MobileAgentNav />}
          <main className="main-with-bottom-nav min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain page-padding lg:pb-safe-bottom">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </PermissionsProvider>
  );
}
