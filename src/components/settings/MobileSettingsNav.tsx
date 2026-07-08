"use client";

import { usePathname } from "next/navigation";
import { isSettingsNavActive } from "@/lib/settings/navigation";
import { useVisibleSettingsNav } from "@/components/settings/useVisibleSettingsNav";
import { AnimatedTabNav } from "@/components/layout/AnimatedTabNav";

/** Mobile-only section switcher for Settings. */
export function MobileSettingsNav() {
  const pathname = usePathname();
  const visibleItems = useVisibleSettingsNav();

  if (visibleItems.length <= 1) return null;

  return (
    <div className="border-b border-slate-200/80 bg-white lg:hidden">
      <AnimatedTabNav
        variant="underline"
        ariaLabel="Settings navigation"
        className="px-2"
        listClassName="min-w-max"
        tabs={visibleItems.map((item) => ({
          href: item.href,
          label: item.label,
          active: isSettingsNavActive(pathname, item.href),
        }))}
      />
    </div>
  );
}
