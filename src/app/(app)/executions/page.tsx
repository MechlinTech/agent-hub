import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { createClient } from "@/lib/supabase/server";

export default async function ExecutionsPage() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("script_reviews")
    .select("*", { count: "exact", head: true });

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          { label: "Script Review Agent", href: "/agents/script-review" },
          { label: "Executions" },
        ]}
      />
      <h1 className="text-2xl font-bold">Executions</h1>
      <p className="mt-2 text-slate-500">
        BlazeMeter test run orchestration is not enabled in this workspace yet.
      </p>
      <div className="card mt-6 p-8 text-center">
        <p className="text-4xl font-bold text-slate-300">0</p>
        <p className="mt-2 text-sm text-slate-500">Test runs recorded</p>
        <p className="mt-4 text-sm text-slate-600">
          You have {count ?? 0} script review{count !== 1 ? "s" : ""} in this workspace. Execution
          tracking will appear here when the Execution Agent is enabled.
        </p>
      </div>
    </div>
  );
}
