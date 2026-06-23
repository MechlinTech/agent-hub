"use client";

import Link from "next/link";
import { Plus, History, Settings } from "lucide-react";
import { WriteGate } from "@/components/permissions/WriteGate";
import { PermissionLink } from "@/components/permissions/PermissionLink";

export function ScriptReviewOverviewHeaderActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <WriteGate resource="script_review">
        <Link
          href="/agents/script-review/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> New Review
        </Link>
        <Link
          href="/agents/script-review/configure"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          <Settings className="h-4 w-4" /> Configure Rules
        </Link>
      </WriteGate>
      <Link
        href="/agents/script-review/history"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
      >
        <History className="h-4 w-4" /> View History
      </Link>
    </div>
  );
}

export function ScriptReviewOverviewStartLinks() {
  return (
    <div className="mt-4 flex flex-wrap gap-4">
      <PermissionLink
        href="/agents/script-review/new"
        resource="script_review"
        requireWrite
        className="text-sm font-medium text-brand-600 hover:underline"
      >
        Start now →
      </PermissionLink>
      <PermissionLink
        href="/agents/script-review/configure"
        resource="script_review"
        requireWrite
        className="text-sm font-medium text-slate-600 hover:underline"
      >
        Configure rules →
      </PermissionLink>
    </div>
  );
}

export function ScriptReviewNewLink({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <PermissionLink
      href="/agents/script-review/new"
      resource="script_review"
      requireWrite
      className={className}
    >
      {children}
    </PermissionLink>
  );
}
