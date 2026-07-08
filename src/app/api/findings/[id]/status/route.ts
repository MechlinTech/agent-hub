import { NextResponse } from "next/server";
import { requireWrite } from "@/lib/supabase/get-auth-context";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireWrite("script_review");
  if (response) return response;

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await request.json();
  const allowed = ["open", "in_progress", "acknowledged", "resolved", "wont_fix"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: finding } = await supabase
    .from("review_findings")
    .select("script_review_id")
    .eq("id", id)
    .single();

  if (!finding) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: review } = await supabase
    .from("script_reviews")
    .select("user_id")
    .eq("id", finding.script_review_id)
    .single();

  if (review?.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("review_findings")
    .update({ status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, status });
}
