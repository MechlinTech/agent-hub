import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export type MarketingShellProps = {
  productEnabled: boolean;
  isAuthenticated: boolean;
  children: ReactNode;
};

export function MarketingShell({
  productEnabled,
  isAuthenticated,
  children,
}: MarketingShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader productEnabled={productEnabled} isAuthenticated={isAuthenticated} />
      <main className="flex-1">{children}</main>
      <SiteFooter productEnabled={productEnabled} isAuthenticated={isAuthenticated} />
    </div>
  );
}
