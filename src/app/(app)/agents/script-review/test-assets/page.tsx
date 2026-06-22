import Link from "next/link";
import { FileCode } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { createClient } from "@/lib/supabase/server";
import { formatBytes, formatDate } from "@/lib/utils";
import { TestAssetDownloadButton } from "@/components/test-assets/DownloadButton";

export default async function TestAssetsPage() {
  const supabase = await createClient();
  const { data: assets } = await supabase
    .from("test_assets")
    .select("id, file_name, file_type, file_size_bytes, storage_path, created_at, script_review_id")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          { label: "Script Review Agent", href: "/agents/script-review" },
          { label: "Test Assets" },
        ]}
      />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Test Assets</h1>
          <p className="mt-1 text-slate-500">
            JMX scripts and attachments stored securely in Supabase Storage.
          </p>
        </div>
        <Link
          href="/agents/script-review/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Upload via New Review
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Uploaded</th>
              <th className="px-4 py-3">Review</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(assets ?? []).map((a) => (
              <tr key={a.id} className="border-t border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 font-medium">
                    <FileCode className="h-4 w-4 text-brand-500" />
                    {a.file_name}
                  </span>
                </td>
                <td className="px-4 py-3">{a.file_type}</td>
                <td className="px-4 py-3 text-slate-500">
                  {a.file_size_bytes ? formatBytes(Number(a.file_size_bytes)) : "-"}
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(a.created_at)}</td>
                <td className="px-4 py-3">
                  {a.script_review_id ? (
                    <Link
                      href={`/agents/script-review/${a.script_review_id}/results`}
                      className="text-brand-600 hover:underline"
                    >
                      View review
                    </Link>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3">
                  <TestAssetDownloadButton path={a.storage_path} fileName={a.file_name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!assets?.length && (
          <p className="p-8 text-center text-slate-500">
            No assets yet. Upload a JMX file from Script Review Agent.
          </p>
        )}
      </div>
    </div>
  );
}
