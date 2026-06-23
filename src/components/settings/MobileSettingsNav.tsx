"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isSettingsNavActive } from "@/lib/settings/navigation";
import { useVisibleSettingsNav } from "@/components/settings/useVisibleSettingsNav";
import { cn } from "@/lib/utils";

/** Mobile-only section switcher for Settings (desktop uses sidebar). */
export function MobileSettingsNav() {
  const pathname = usePathname();
  const visibleItems = useVisibleSettingsNav();

  if (visibleItems.length <= 1) return null;

  return (
    <div className="border-b border-slate-200/80 bg-white px-4 lg:hidden">
      <div className="-mb-px flex gap-1 overflow-x-auto scrollbar-none py-1">
        {visibleItems.map((item) => {
          const active = isSettingsNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
