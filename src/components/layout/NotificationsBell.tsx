"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
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

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
        className="touch-target relative flex items-center justify-center rounded-full text-slate-700 active:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell className="h-[22px] w-[22px]" strokeWidth={2} />
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+var(--safe-bottom))] z-50 max-h-[72dvh] overflow-hidden rounded-t-[1.25rem] bg-white shadow-[0_-16px_48px_rgba(15,23,42,0.12)] lg:absolute lg:inset-x-auto lg:bottom-auto lg:right-0 lg:mt-2 lg:max-h-80 lg:w-[22rem] lg:rounded-2xl lg:shadow-xl">
            <div className="sheet-handle mt-2 lg:hidden" />
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <span className="text-base font-bold text-slate-900">Notifications</span>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs font-semibold text-brand-600 active:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="touch-target rounded-full p-1.5 text-slate-500 lg:hidden"
                  aria-label="Close notifications"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <ul className="max-h-[calc(72dvh-4.5rem)] overflow-y-auto overscroll-y-contain lg:max-h-72">
              {items.length ? (
                items.map((n) => (
                  <li
                    key={n.id}
                    className="border-b border-slate-50 px-5 py-4 text-sm last:border-0 active:bg-slate-50"
                  >
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    {n.subtitle && (
                      <p className="mt-0.5 leading-relaxed text-slate-500">{n.subtitle}</p>
                    )}
                    <p className="mt-1.5 text-xs font-medium text-slate-400">
                      {formatRelativeTime(n.created_at)}
                    </p>
                  </li>
                ))
              ) : (
                <li className="px-5 py-12 text-center">
                  <Bell className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">No notifications yet</p>
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
