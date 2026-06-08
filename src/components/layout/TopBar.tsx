"use client";

import { useRouter } from "next/navigation";
import { HelpCircle, LogOut, Menu } from "lucide-react";
import { NotificationsBell } from "./NotificationsBell";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function TopBar({
  user,
  profile,
  onMenuClick,
}: {
  user: User;
  profile?: { full_name?: string; team_name?: string; avatar_url?: string } | null;
  onMenuClick?: () => void;
}) {
  const router = useRouter();
  const name = profile?.full_name ?? user.email?.split("@")[0] ?? "User";
  const team = profile?.team_name ?? "Performance Team";

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open menu"
          onClick={onMenuClick}
          className="touch-target -ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-white">
            AH
          </div>
          <span className="text-sm font-semibold text-slate-800">Agent Hub</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <NotificationsBell userId={user.id} />
        <button
          type="button"
          className="touch-target rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden text-left md:block">
            <p className="max-w-[120px] truncate text-sm font-medium text-slate-800 lg:max-w-none">
              {name}
            </p>
            <p className="max-w-[120px] truncate text-xs text-slate-500 lg:max-w-none">{team}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            title="Sign out"
            className="touch-target rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
