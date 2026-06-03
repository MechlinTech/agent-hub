import { createClient } from "@/lib/supabase/server";
import type { ReportData } from "./generator";

export async function fetchReportData(reviewId: string, userId: string): Promise<ReportData | null> {
  const supabase = await createClient();

  const { data: review } = await supabase
    .from("script_reviews")
    .select("*")
    .eq("id", reviewId)
    .eq("user_id", userId)
    .single();

  if (!review) return null;

  const { data: findings } = await supabase
    .from("review_findings")
    .select("rule_id, finding_code, severity, category, element, issue, impact, recommendation")
    .eq("script_review_id", reviewId);

  return {
    scriptName: review.script_name,
    externalReviewId: review.external_review_id,
    reviewDate: review.created_at,
    score: review.score ?? 0,
    readiness: review.readiness,
    executiveSummary: review.executive_summary,
    inventory: review.inventory as Record<string, number> | null,
    topRisks: (review.top_risks as string[]) ?? [],
    fixOrder: (review.fix_order as string[]) ?? [],
    aiMode: review.ai_mode ?? "disabled",
    findings: findings ?? [],
  };
}
