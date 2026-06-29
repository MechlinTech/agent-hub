"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, LogOut } from "lucide-react";
import { NotificationsBell } from "./NotificationsBell";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  getMobileBackHref,
  getMobilePageTitle,
  isMobileRootTab,
} from "@/lib/mobile-nav";

import type { AppRole } from "@/lib/permissions";
import { getRoleLabel } from "@/lib/permissions";
import { AgentHubLogo } from "@/components/brand/AgentHubMark";

export function TopBar({
  user,
  profile,
  role,
}: {
  user: User;
  profile?: { full_name?: string; team_name?: string; avatar_url?: string } | null;
  role?: AppRole;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const name = profile?.full_name ?? user.email?.split("@")[0] ?? "User";
  const team = profile?.team_name ?? "Performance Team";
  const title = getMobilePageTitle(pathname);
  const backHref = getMobileBackHref(pathname);
  const isRootTab = isMobileRootTab(pathname);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="safe-top sticky top-0 z-20 shrink-0 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl backdrop-saturate-150 lg:hidden">
        <div className="relative flex h-[var(--mobile-header-height)] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-1 lg:gap-3">
            {backHref ? (
              <button
                type="button"
                aria-label="Go back"
                onClick={() => router.push(backHref)}
                className="touch-target -ml-2 flex shrink-0 items-center justify-center rounded-full text-slate-800 active:bg-slate-100 lg:hidden"
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={2} />
              </button>
            ) : isRootTab ? (
              <div className="flex items-center gap-2.5 lg:hidden">
                <AgentHubLogo size="sm" />
                <span className="text-[17px] font-bold tracking-tight text-slate-900">
                  Agent Hub
                </span>
              </div>
            ) : (
              <div className="w-10 shrink-0 lg:hidden" aria-hidden />
            )}

            <div className="hidden min-w-0 items-center gap-2 lg:flex">
              <AgentHubLogo size="sm" />
              <span className="text-sm font-semibold text-slate-800">Agent Hub</span>
            </div>
          </div>

          {!isRootTab && (
            <h1 className="pointer-events-none absolute left-1/2 max-w-[45%] -translate-x-1/2 truncate text-[17px] font-bold tracking-tight text-slate-900 lg:hidden">
              {title}
            </h1>
          )}

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
            <NotificationsBell userId={user.id} />
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-50 text-sm font-bold text-brand-700 ring-2 ring-white sm:hidden"
              aria-label="Account menu"
            >
              {name.charAt(0).toUpperCase()}
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden text-left md:block">
                <p className="max-w-[120px] truncate text-sm font-medium text-slate-800 lg:max-w-none">
                  {name}
                </p>
                <p className="max-w-[120px] truncate text-xs text-slate-500 lg:max-w-none">
                  {team}
                  {role ? ` · ${getRoleLabel(role)}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={signOut}
                title="Sign out"
                className="touch-target rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {profileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] sm:hidden"
            onClick={() => setProfileOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+var(--safe-bottom))] z-50 overflow-hidden rounded-t-[1.25rem] bg-white shadow-[0_-16px_48px_rgba(15,23,42,0.12)] sm:hidden">
            <div className="sheet-handle mt-2" />
            <div className="px-5 pb-5 pt-1">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-50 text-xl font-bold text-brand-700">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-slate-900">{name}</p>
                  <p className="truncate text-sm text-slate-500">{team}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  signOut();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3.5 text-sm font-semibold text-slate-800 active:bg-slate-200"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
