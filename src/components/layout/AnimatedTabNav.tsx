"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AnimatedTabItem = {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
  icon?: LucideIcon;
};

type IndicatorStyle = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const INDICATOR_TRANSITION =
  "transition-[left,top,width,height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

export function AnimatedTabNav({
  tabs,
  variant = "light",
  size = "default",
  className,
  listClassName,
  ariaLabel,
}: {
  tabs: AnimatedTabItem[];
  variant?: "dark" | "light" | "underline";
  size?: "default" | "compact";
  className?: string;
  listClassName?: string;
  ariaLabel?: string;
}) {
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [indicator, setIndicator] = useState<IndicatorStyle>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const [ready, setReady] = useState(false);

  const activeHref = tabs.find((tab) => tab.active)?.href;

  useLayoutEffect(() => {
    function measure() {
      const list = listRef.current;
      if (!list || !activeHref) {
        setReady(false);
        return;
      }

      const activeEl = tabRefs.current.get(activeHref);
      if (!activeEl) {
        setReady(false);
        return;
      }

      setIndicator({
        left: activeEl.offsetLeft,
        top: activeEl.offsetTop,
        width: activeEl.offsetWidth,
        height: activeEl.offsetHeight,
      });
      setReady(true);
    }

    measure();
    window.addEventListener("resize", measure);
    const navEl = navRef.current;
    navEl?.addEventListener("scroll", measure, { passive: true });

    return () => {
      window.removeEventListener("resize", measure);
      navEl?.removeEventListener("scroll", measure);
    };
  }, [activeHref, tabs]);

  const indicatorClass = cn(
    "pointer-events-none absolute rounded-full",
    INDICATOR_TRANSITION,
    variant === "dark" &&
      "bg-gradient-to-r from-brand-600 to-brand-400 shadow-sm shadow-brand-600/30",
    variant === "light" &&
      "bg-gradient-to-r from-brand-600 to-brand-400 shadow-sm shadow-brand-600/25",
    variant === "underline" &&
      "top-auto bottom-0 h-px rounded-none bg-brand-500/70 shadow-none",
  );

  return (
    <nav
      ref={navRef}
      className={cn(
        "relative",
        variant === "underline"
          ? "overflow-x-auto scrollbar-none"
          : variant === "dark"
            ? "overflow-hidden"
            : "overflow-visible",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div
        ref={listRef}
        className={cn(
          "relative flex items-center",
          size === "compact" ? "gap-0.5" : "gap-1",
          listClassName,
        )}
      >
        <div
          aria-hidden
          className={cn(indicatorClass, !ready && "opacity-0")}
          style={{
            left: indicator.left,
            top: variant === "underline" ? undefined : indicator.top,
            width: indicator.width,
            height: variant === "underline" ? undefined : indicator.height,
          }}
        />

        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              ref={(node) => {
                if (node) tabRefs.current.set(tab.href, node);
                else tabRefs.current.delete(tab.href);
              }}
              href={tab.href}
              onClick={tab.onClick}
              className={cn(
                "relative z-10 shrink-0 transition-colors duration-200",
                variant !== "underline" && "rounded-full font-semibold",
                variant !== "underline" &&
                  (size === "compact"
                    ? "px-3 py-1.5 text-xs"
                    : "px-4 py-2 text-sm"),
                variant === "underline" &&
                  (size === "compact"
                    ? "rounded-none px-3 py-2 text-sm"
                    : "rounded-none px-4 py-3.5 text-sm"),
                variant === "underline" &&
                  (tab.active
                    ? "font-semibold text-slate-900"
                    : "font-medium text-slate-500 hover:text-slate-700"),
                variant === "dark" &&
                  (tab.active
                    ? "text-white"
                    : "text-indigo-400 hover:bg-violet-100/60 hover:text-indigo-800"),
                variant === "light" &&
                  (tab.active
                    ? "text-white"
                    : "text-indigo-600 hover:bg-violet-200/80 hover:text-indigo-900"),
              )}
            >
              <span
                className={cn(
                  "flex items-center",
                  size === "compact" ? "gap-1.5" : "gap-2",
                )}
              >
                {Icon ? (
                  <Icon
                    className={cn(
                      "shrink-0",
                      size === "compact" ? "h-3.5 w-3.5" : "h-4 w-4",
                    )}
                  />
                ) : null}
                <span className="whitespace-nowrap">{tab.label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AnimatedTabNavRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-[1400px] flex-wrap items-center gap-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
