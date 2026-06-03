"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";

export function NotificationsBell({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<
    { id: string; title: string; subtitle: string | null; created_at: string }[]
  >([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { count: unread } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      setCount(unread ?? 0);

      const { data } = await supabase
        .from("notifications")
        .select("id, title, subtitle, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      setItems(data ?? []);
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  async function markAllRead() {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setCount(0);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative text-slate-500 hover:text-slate-700"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="font-semibold text-slate-900">Notifications</span>
              {count > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-brand-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-72 overflow-y-auto">
              {items.length ? (
                items.map((n) => (
                  <li key={n.id} className="border-b border-slate-50 px-4 py-3 text-sm last:border-0">
                    <p className="font-medium text-slate-800">{n.title}</p>
                    {n.subtitle && <p className="text-slate-500">{n.subtitle}</p>}
                    <p className="mt-1 text-xs text-slate-400">{formatRelativeTime(n.created_at)}</p>
                  </li>
                ))
              ) : (
                <li className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet</li>
              )}
            </ul>
            <div className="border-t px-4 py-2">
              <Link
                href="/agents/script-review/history"
                className="text-xs text-brand-600 hover:underline"
                onClick={() => setOpen(false)}
              >
                View review history
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
