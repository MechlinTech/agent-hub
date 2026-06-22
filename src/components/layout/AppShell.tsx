"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { MobileAgentNav } from "./MobileAgentNav";

export function AppShell({
  children,
  user,
  profile,
}: {
  children: React.ReactNode;
  user: User;
  profile?: { full_name?: string; team_name?: string } | null;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden app-shell-bg">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar user={user} profile={profile} />
        <MobileAgentNav />
        <main className="main-with-bottom-nav min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain page-padding lg:pb-safe-bottom">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
