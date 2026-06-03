import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: review } = await supabase
    .from("script_reviews")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase.from("review_findings").delete().eq("script_review_id", id);
  await supabase.from("review_activity_logs").delete().eq("script_review_id", id);

  await supabase
    .from("script_reviews")
    .update({
      status: "pending",
      progress_percent: 0,
      current_step: "Re-running review",
      score: null,
      readiness: null,
      executive_summary: null,
      inventory: {},
      top_risks: [],
      fix_order: [],
      completed_at: null,
      error_message: null,
    })
    .eq("id", id);

  return NextResponse.json({
    success: true,
    redirect: `/agents/script-review/${id}/analyzing`,
  });
}
