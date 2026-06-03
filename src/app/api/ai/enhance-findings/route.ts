import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enhanceFindingsWithAI, generateAiExecutiveSummary, isAiConfigured } from "@/lib/jmx/ai-layer";
import type { Finding, JmxInventory } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: settings } = await supabase
    .from("user_settings")
    .select("ai_recommendation_mode")
    .eq("user_id", user.id)
    .single();

  const body = await request.json();
  const {
    reviewId,
    findings,
    scriptName,
    inventory,
    environment,
    slaProfile,
    generateSummary,
    score,
  } = body as {
    reviewId?: string;
    findings: Finding[];
    scriptName: string;
    inventory: JmxInventory;
    environment: string;
    slaProfile: string;
    generateSummary?: boolean;
    score?: number;
  };

  let aiAllowed = settings?.ai_recommendation_mode === "enabled";

  if (reviewId) {
    const { data: review } = await supabase
      .from("script_reviews")
      .select("user_id, ai_mode, config")
      .eq("id", reviewId)
      .single();

    if (!review || review.user_id !== user.id) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const reviewAiMode =
      review.ai_mode ??
      (review.config as { aiRecommendationMode?: string })?.aiRecommendationMode;
    if (reviewAiMode === "enabled") aiAllowed = true;
    if (reviewAiMode === "disabled") aiAllowed = false;
  }

  if (!aiAllowed) {
    return NextResponse.json({ error: "AI Recommendation Mode is disabled for this review" }, { status: 403 });
  }

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "No AI provider configured on server (OpenAI, Gemini, or Groq)" },
      { status: 503 }
    );
  }

  try {
    const enhanced = await enhanceFindingsWithAI(findings, {
      scriptName,
      inventory,
      environment,
      slaProfile,
    });

    let executiveSummary: string | null = null;
    if (generateSummary && score !== undefined) {
      executiveSummary = await generateAiExecutiveSummary(scriptName, score, enhanced);
    }

    return NextResponse.json({ findings: enhanced, executiveSummary });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI enhancement failed" },
      { status: 500 }
    );
  }
}
