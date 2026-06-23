import type { LucideIcon } from "lucide-react";
import { Shield, User, Users } from "lucide-react";
import type { Resource } from "@/lib/permissions";

export interface SettingsNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Permission resource required to see this item (read). */
  resource?: Resource;
  /** If true, requires write on the resource. */
  requireWrite?: boolean;
}

export const SETTINGS_BASE = "/settings";

export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    href: "/settings",
    label: "Profile",
    icon: User,
    title: "Profile",
    subtitle: "Your name, team, and AI recommendation preferences.",
    resource: "settings",
  },
  {
    href: "/settings/users",
    label: "Users",
    icon: Users,
    title: "Users",
    subtitle: "Assign roles and control read or write access for each team member.",
    resource: "users",
  },
  {
    href: "/settings/roles",
    label: "Role permissions",
    icon: Shield,
    title: "Role permissions",
    subtitle:
      "Define default access for each role. Individual users can still be customized on Users.",
    resource: "users",
    requireWrite: true,
  },
];

export function isSettingsPath(pathname: string): boolean {
  return pathname === SETTINGS_BASE || pathname.startsWith(`${SETTINGS_BASE}/`);
}

export function isSettingsNavActive(pathname: string, href: string): boolean {
  if (href === SETTINGS_BASE) {
    return pathname === SETTINGS_BASE;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveSettingsSection(pathname: string): SettingsNavItem | null {
  for (const item of [...SETTINGS_NAV].reverse()) {
    if (isSettingsNavActive(pathname, item.href) && item.href !== SETTINGS_BASE) {
      return item;
    }
  }
  if (pathname === SETTINGS_BASE) {
    return SETTINGS_NAV[0];
  }
  return null;
}

export function filterVisibleSettingsNav(
  canRead: (resource: Resource) => boolean,
  canWrite: (resource: Resource) => boolean
): SettingsNavItem[] {
  return SETTINGS_NAV.filter((item) => {
    if (!item.resource) return true;
    if (item.requireWrite) return canWrite(item.resource);
    return canRead(item.resource);
  });
}
