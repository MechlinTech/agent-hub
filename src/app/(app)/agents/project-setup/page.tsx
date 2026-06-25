import Link from "next/link";
import { FolderOpen, Plus, Terminal } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PermissionLink } from "@/components/permissions/PermissionLink";
import { listProjectSetups } from "@/lib/project-setup-service-server";
import { formatDate } from "@/lib/utils";

export default async function ProjectSetupOverviewPage() {
  const setups = await listProjectSetups(8);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          { label: "Project Setup Agent" },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50">
            <FolderOpen className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Project Setup Agent</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Configure your stack and scaffold projects on your machine. Requires the Local Executor
              running on the same PC as your browser.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PermissionLink
          href="/agents/project-setup/new"
          resource="project_setup"
          requireWrite
          className="card flex items-start gap-3 p-5 transition hover:border-brand-200 hover:shadow-md"
        >
          <Plus className="mt-0.5 h-5 w-5 text-brand-600" />
          <div>
            <p className="font-semibold text-slate-900">New Setup</p>
            <p className="mt-1 text-sm text-slate-500">Start the 3-step wizard</p>
          </div>
        </PermissionLink>
        <Link
          href="/settings/local-executor"
          className="card flex items-start gap-3 p-5 transition hover:border-brand-200 hover:shadow-md"
        >
          <Terminal className="mt-0.5 h-5 w-5 text-slate-600" />
          <div>
            <p className="font-semibold text-slate-900">Local Executor</p>
            <p className="mt-1 text-sm text-slate-500">Install, pair, and check connection</p>
          </div>
        </Link>
      </div>

      <details className="card mb-6 p-5">
        <summary className="cursor-pointer font-semibold text-slate-900">
          How Project Setup works
        </summary>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-600">
          <li>Run the Local Executor on your PC (`npm run executor`).</li>
          <li>Pair it with your AgentHub account in Settings.</li>
          <li>Configure scope, stack, and target folder in the wizard.</li>
          <li>Run Agent — files and commands execute locally via the executor.</li>
        </ol>
      </details>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Recent Setups</h2>
          <Link
            href="/agents/project-setup/history"
            className="text-sm text-brand-600 hover:underline"
          >
            View all
          </Link>
        </div>
        {setups.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No setups yet.{" "}
            <PermissionLink
              href="/agents/project-setup/new"
              resource="project_setup"
              requireWrite
              className="text-brand-600 underline"
            >
              Create your first project
            </PermissionLink>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {setups.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">{s.projectName}</td>
                    <td className="px-4 py-3 capitalize text-slate-600">
                      {s.projectScope.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">{s.status}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
