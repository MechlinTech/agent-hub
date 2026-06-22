"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_TAB_NAV } from "@/lib/mobile-nav";
import { isGlobalNavActive } from "@/lib/agents/navigation";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="bottom-nav fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/90 shadow-[0_-8px_32px_rgba(15,23,42,0.06)] backdrop-blur-xl backdrop-saturate-150 lg:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-[var(--bottom-nav-height)] max-w-lg items-stretch justify-around px-2">
        {MOBILE_TAB_NAV.map((item) => {
          const active = isGlobalNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 transition-all duration-200 active:scale-95",
                active ? "text-slate-900" : "text-slate-400"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-colors duration-200",
                  active && "bg-brand-50 text-brand-600"
                )}
              >
                <Icon
                  className={cn("h-[22px] w-[22px] shrink-0", active && "stroke-[2.25]")}
                  aria-hidden
                />
              </span>
              <span
                className={cn(
                  "max-w-full truncate text-[10px] leading-none tracking-wide",
                  active ? "font-semibold text-slate-900" : "font-medium text-slate-400"
                )}
              >
                {item.label}
              </span>
              {active && (
                <span
                  className="absolute top-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-brand-600"
                  aria-hidden
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
