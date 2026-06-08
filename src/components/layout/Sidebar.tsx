"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  ChevronLeft,
  FileBarChart,
  LayoutDashboard,
  Play,
  Plug,
  Settings,
  FolderOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/test-assets", label: "Test Assets", icon: FolderOpen },
  { href: "/executions", label: "Executions", icon: Play },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  collapsed,
  mobileOpen,
  onMobileClose,
  onToggle,
}: {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onToggle?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-200 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-16" : "w-64 lg:w-56"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              AH
            </div>
            {(!collapsed || mobileOpen) && (
              <span className="text-sm font-semibold text-slate-800">Agent Hub</span>
            )}
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onMobileClose}
            className="touch-target rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {(!collapsed || mobileOpen) && item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onToggle}
          className="hidden items-center gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 hover:text-slate-700 lg:flex"
        >
          <ChevronLeft className={cn("h-4 w-4", collapsed && "rotate-180")} />
          {!collapsed && "Collapse"}
        </button>
      </aside>
    </>
  );
}
