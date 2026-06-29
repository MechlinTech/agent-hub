"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

export function NotificationsBell({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [desktopPanelStyle, setDesktopPanelStyle] = useState({
    top: 0,
    right: 0,
  });
  const isDesktop = useIsDesktop();
  const bellRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<
    { id: string; title: string; subtitle: string | null; created_at: string }[]
  >([]);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((value) => !value), []);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (!open || isDesktop) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, isDesktop]);

  useEffect(() => {
    if (!open) return;

    function updateDesktopPosition() {
      const bell = bellRef.current;
      if (!bell) return;
      const rect = bell.getBoundingClientRect();
      setDesktopPanelStyle({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }

    if (isDesktop) {
      updateDesktopPosition();
      window.addEventListener("resize", updateDesktopPosition);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("resize", updateDesktopPosition);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, isDesktop, close]);

  // Close on outside tap/click (mobile + desktop). Backdrop is visual-only.
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        bellRef.current?.contains(target)
      ) {
        return;
      }
      close();
    }

    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("touchstart", handlePointerDown, {
        passive: true,
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open, close]);

  async function markAllRead() {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setCount(0);
  }

  const panel =
    open && mounted ? (
      <>
        {!isDesktop && (
          <div
            className="pointer-events-none fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-[2px]"
            aria-hidden
          />
        )}
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className={
            isDesktop
              ? "fixed z-[110] flex max-h-80 w-[22rem] flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
              : "fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+var(--safe-bottom))] z-[101] flex max-h-[72dvh] flex-col overflow-hidden rounded-t-[1.25rem] bg-white shadow-[0_-16px_48px_rgba(15,23,42,0.12)]"
          }
          style={isDesktop ? desktopPanelStyle : undefined}
        >
          {!isDesktop && <div className="sheet-handle mt-2 shrink-0" />}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <span className="text-base font-bold text-slate-900">
              Notifications
            </span>
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
              {!isDesktop && (
                <button
                  type="button"
                  onClick={close}
                  className="touch-target rounded-full p-1.5 text-slate-500"
                  aria-label="Close notifications"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          <ul className="scrollbar-brand min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-3">
            {items.length ? (
              items.map((n) => (
                <li
                  key={n.id}
                  className="border-b border-slate-50 px-5 py-4 text-sm last:border-0 active:bg-slate-50"
                >
                  <p className="font-semibold text-slate-900">{n.title}</p>
                  {n.subtitle && (
                    <p className="mt-0.5 leading-relaxed text-slate-500">
                      {n.subtitle}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs font-medium text-slate-400">
                    {formatRelativeTime(n.created_at)}
                  </p>
                </li>
              ))
            ) : (
              <li className="px-5 py-12 text-center">
                <Bell className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">
                  No notifications yet
                </p>
              </li>
            )}
          </ul>
        </div>
      </>
    ) : null;

  return (
    <div className="relative">
      <button
        ref={bellRef}
        type="button"
        onClick={toggle}
        className="touch-target relative flex items-center justify-center rounded-full text-slate-700 active:bg-slate-100"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-[22px] w-[22px]" strokeWidth={2} />
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
