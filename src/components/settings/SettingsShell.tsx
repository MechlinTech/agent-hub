"use client";

import { usePathname } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getActiveSettingsSection, SETTINGS_BASE } from "@/lib/settings/navigation";

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const section = getActiveSettingsSection(pathname);
  const meta = section ?? {
    label: "Settings",
    title: "Settings",
    subtitle: "Manage your profile, team access, and workspace permissions.",
  };

  const breadcrumbItems = [
    { label: "Home", href: "/dashboard" },
    { label: "Settings", href: SETTINGS_BASE },
    ...(section && section.href !== SETTINGS_BASE ? [{ label: section.label }] : []),
  ];

  return (
    <div>
      <Breadcrumbs items={breadcrumbItems} />
      <div className="page-header">
        <h1 className="page-title">{meta.title}</h1>
        <p className="page-subtitle">{meta.subtitle}</p>
      </div>
      {children}
    </div>
  );
}
