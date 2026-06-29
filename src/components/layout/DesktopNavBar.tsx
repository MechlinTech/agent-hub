"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { isGlobalNavActive } from "@/lib/agents/navigation";
import { filterGlobalNavByAccess } from "@/lib/navigation-access";
import { usePermissions } from "@/lib/permissions-context";
import type { AppRole } from "@/lib/permissions";
import { getRoleLabel } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";
import { NotificationsBell } from "./NotificationsBell";
import { GlobalSearch } from "./GlobalSearch";
import { AnimatedTabNav } from "@/components/layout/AnimatedTabNav";
import { AgentHubLogo } from "@/components/brand/AgentHubMark";

export function DesktopNavBar({
  user,
  profile,
  role,
}: {
  user: User;
  profile?: { full_name?: string; team_name?: string } | null;
  role?: AppRole;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { canRead, canWrite } = usePermissions();
  const visibleNav = filterGlobalNavByAccess(canRead, canWrite);
  const name = profile?.full_name ?? user.email?.split("@")[0] ?? "User";
  const team = profile?.team_name ?? "Performance Team";
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!confirmOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !signingOut) {
        setConfirmOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [confirmOpen, signingOut]);

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="hidden px-6 pt-5 pb-5 lg:block">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 rounded-4xl border border-white/70 bg-white/55 px-5 py-3 shadow-nav backdrop-blur-xl backdrop-saturate-150">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          <AgentHubLogo size="md" />
          <span className="text-base font-bold tracking-tight text-indigo-950">
            Agent Hub
          </span>
        </Link>

        <AnimatedTabNav
          variant="light"
          ariaLabel="Main navigation"
          className="mx-auto min-w-0 rounded-full bg-violet-100/50 p-1 ring-1 ring-violet-200/50"
          tabs={visibleNav.map((item) => ({
            href: item.href,
            label: item.label,
            icon: item.icon,
            active: isGlobalNavActive(pathname, item.href),
          }))}
        />

        <div className="flex shrink-0 items-center gap-2">
          <div className="[&_button]:rounded-full [&_button]:text-indigo-500 [&_button]:hover:bg-violet-100/80 [&_button]:hover:text-indigo-900">
            <NotificationsBell userId={user.id} />
          </div>
          <div className="flex items-center gap-2 rounded-full bg-violet-100/60 py-1 pl-1 pr-3 ring-1 ring-violet-200/50">
            <div className="brand-gradient flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden min-w-0 text-left md:block">
              <p className="max-w-[100px] truncate text-xs font-semibold text-indigo-950 lg:max-w-[120px]">
                {name}
              </p>
              <p className="max-w-[100px] truncate text-[10px] text-indigo-400 lg:max-w-[120px]">
                {role ? getRoleLabel(role) : team}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            title="Sign out"
            aria-haspopup="dialog"
            className="flex h-10 w-10 items-center justify-center rounded-full text-indigo-400 transition-colors hover:bg-violet-100/80 hover:text-indigo-800"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {mounted && confirmOpen
        ? createPortal(
            <div className="glass-dialog-overlay fixed inset-0 z-[120] flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0"
                aria-label="Close sign out dialog"
                disabled={signingOut}
                onClick={() => setConfirmOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="sign-out-title"
                className="glass-dialog relative z-10 w-full max-w-[22rem]"
              >
                <div className="px-6 pb-2 pt-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-white text-brand-600 ring-1 ring-brand-100/80">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <h2
                    id="sign-out-title"
                    className="text-lg font-bold tracking-tight text-slate-900"
                  >
                    Sign out?
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    You will need to sign in again to access Agent Hub.
                  </p>
                </div>
                <div className="flex gap-2.5 px-6 pb-6 pt-4">
                  <button
                    type="button"
                    disabled={signingOut}
                    onClick={() => setConfirmOpen(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={signingOut}
                    onClick={signOut}
                    className="btn-primary flex-1"
                  >
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
