import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const { data: reviews } = await supabase
    .from("script_reviews")
    .select("id, script_name, score, status, external_review_id")
    .or(`script_name.ilike.%${q}%,external_review_id.ilike.%${q}%`)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: assets } = await supabase
    .from("test_assets")
    .select("id, file_name, script_review_id")
    .ilike("file_name", `%${q}%`)
    .limit(5);

  const results = [
    ...(reviews ?? []).map((r) => ({
      type: "review" as const,
      id: r.id,
      label: r.script_name,
      sub: r.external_review_id ?? r.status,
      href: r.status === "completed" ? `/agents/script-review/${r.id}/results` : `/agents/script-review/${r.id}/analyzing`,
    })),
    ...(assets ?? []).map((a) => ({
      type: "asset" as const,
      id: a.id,
      label: a.file_name,
      sub: "Test asset",
      href: "/test-assets",
    })),
  ];

  return NextResponse.json({ results });
}
