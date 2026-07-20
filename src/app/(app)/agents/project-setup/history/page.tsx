import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { listProjectSetups } from "@/lib/project-setup-service-server";
import { formatDate } from "@/lib/utils";

export default async function ProjectSetupHistoryPage() {
  const setups = await listProjectSetups(50);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          { label: "Dev Scaffold", href: "/agents/project-setup" },
          { label: "History" },
        ]}
      />
      <h1 className="page-title">Setup History</h1>
      <p className="page-subtitle mb-6">Past Dev Scaffold jobs (metadata only).</p>

      <div className="card overflow-hidden">
        {setups.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">No history yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {setups.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.externalId}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{s.projectName}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600">{s.locationPath}</td>
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

      <div className="mt-4">
        <Link href="/agents/project-setup" className="text-sm text-brand-600 hover:underline">
          Back to overview
        </Link>
      </div>
    </div>
  );
}
