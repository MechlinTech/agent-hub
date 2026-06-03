import { createClient } from "@/lib/supabase/server";

export async function getDashboardMetrics(userId: string) {
  const supabase = await createClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { count: completedReviews } = await supabase
    .from("script_reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  const { count: reviewsThisWeek } = await supabase
    .from("script_reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("completed_at", weekAgo);

  const { count: reviewsPrevWeek } = await supabase
    .from("script_reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("completed_at", twoWeeksAgo)
    .lt("completed_at", weekAgo);

  const { count: inProgressReviews } = await supabase
    .from("script_reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["pending", "parsing", "scanning", "scoring"]);

  const { data: userReviews } = await supabase
    .from("script_reviews")
    .select("id")
    .eq("user_id", userId);

  const reviewIds = userReviews?.map((r) => r.id) ?? [];

  let openCriticalFindings = 0;
  let criticalFindingsThisWeek = 0;
  let criticalFindingsPrevWeek = 0;
  if (reviewIds.length) {
    const { count } = await supabase
      .from("review_findings")
      .select("*", { count: "exact", head: true })
      .in("script_review_id", reviewIds)
      .in("severity", ["critical", "high"])
      .eq("status", "open");
    openCriticalFindings = count ?? 0;

    const { count: critThisWeek } = await supabase
      .from("review_findings")
      .select("*", { count: "exact", head: true })
      .in("script_review_id", reviewIds)
      .in("severity", ["critical", "high"])
      .gte("created_at", weekAgo);
    criticalFindingsThisWeek = critThisWeek ?? 0;

    const { count: critPrevWeek } = await supabase
      .from("review_findings")
      .select("*", { count: "exact", head: true })
      .in("script_review_id", reviewIds)
      .in("severity", ["critical", "high"])
      .gte("created_at", twoWeeksAgo)
      .lt("created_at", weekAgo);
    criticalFindingsPrevWeek = critPrevWeek ?? 0;
  }

  return {
    scriptsReviewed: completedReviews ?? 0,
    reviewsThisWeek: reviewsThisWeek ?? 0,
    reviewsPrevWeek: reviewsPrevWeek ?? 0,
    inProgressReviews: inProgressReviews ?? 0,
    openCriticalFindings,
    criticalFindingsThisWeek,
    criticalFindingsPrevWeek,
    activeAgents: 1,
  };
}

export async function getRecentActivity(userId: string, limit = 8) {
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, subtitle, created_at, notification_type")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (notifications?.length) return notifications;

  const { data: reviews } = await supabase
    .from("script_reviews")
    .select("id, script_name, status, created_at, score")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (reviews ?? []).map((r) => ({
    id: r.id,
    title:
      r.status === "completed"
        ? "Script review completed"
        : r.status === "failed"
          ? "Script review failed"
          : "Script review in progress",
    subtitle: r.script_name,
    created_at: r.created_at,
    notification_type: "review",
    review_id: r.id,
    score: r.score,
  }));
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count ?? 0;
}

export async function getFailurePatterns(userId: string, limit = 5) {
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from("script_reviews")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "completed");

  const reviewIds = reviews?.map((r) => r.id) ?? [];
  if (!reviewIds.length) return [];

  const { data: findings } = await supabase
    .from("review_findings")
    .select("rule_id, issue")
    .in("script_review_id", reviewIds);

  if (!findings?.length) return [];

  const counts = new Map<string, { label: string; count: number }>();
  for (const f of findings) {
    const key = f.rule_id;
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { label: f.issue, count: 1 });
  }

  const total = findings.length;
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((p) => ({
      label: p.label,
      count: p.count,
      percent: Math.round((p.count / total) * 100),
    }));
}

export async function getRulePacks() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rule_packs")
    .select("id, name, version, description, rule_count, is_default")
    .order("is_default", { ascending: false });
  return data ?? [];
}

export async function getLatestCompletedReviewId(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("script_reviews")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function getReportExports(reviewId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("report_exports")
    .select("format, file_name, created_at")
    .eq("script_review_id", reviewId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
