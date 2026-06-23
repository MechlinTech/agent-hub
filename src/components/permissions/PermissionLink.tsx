"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import type { Resource } from "@/lib/permissions";
import { canAccessNavHref } from "@/lib/navigation-access";
import { usePermissions } from "@/lib/permissions-context";

type PermissionLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  resource?: Resource;
  requireWrite?: boolean;
};

export function PermissionLink({
  href,
  resource,
  requireWrite,
  children,
  ...props
}: PermissionLinkProps) {
  const { canRead, canWrite } = usePermissions();
  const allowed = resource
    ? requireWrite
      ? canWrite(resource)
      : canRead(resource)
    : canAccessNavHref(href, canRead, canWrite);

  if (!allowed) return null;

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}
