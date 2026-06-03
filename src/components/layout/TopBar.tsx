"use client";

import { useRouter } from "next/navigation";
import { HelpCircle, LogOut } from "lucide-react";
import { NotificationsBell } from "./NotificationsBell";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function TopBar({
  user,
  profile,
}: {
  user: User;
  profile?: { full_name?: string; team_name?: string; avatar_url?: string } | null;
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
    <header className="flex h-14 items-center justify-end border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <NotificationsBell userId={user.id} />
        <button type="button" className="text-slate-500 hover:text-slate-700">
          <HelpCircle className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-slate-800">{name}</p>
            <p className="text-xs text-slate-500">{team}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            title="Sign out"
            className="ml-1 text-slate-400 hover:text-slate-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
