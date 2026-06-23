import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">403</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Access denied</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        You do not have permission to view this page. Contact an administrator if you
        believe this is a mistake.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
