"use client";

import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function DashboardWelcome() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      setName(profile?.full_name ?? user.email?.split("@")[0] ?? "there");
    }
    load();
  }, []);

  return (
    <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {/* <h1 className="page-title">
          {name ? (
            <>
              Welcome back, <span className="text-brand-600">{name}</span>
            </>
          ) : (
            "Welcome back"
          )}
        </h1> */}
        <h6 className="text-md font-medium text-slate-500">
          Here&apos;s what&apos;s happening in your performance engineering
          workspace today.
        </h6>
      </div>
      <div className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-float">
        <Sparkles className="h-4 w-4" />
        AI Agents
      </div>
    </div>
  );
}
