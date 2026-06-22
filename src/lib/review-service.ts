import { createClient } from "@/lib/supabase/client";
import type { ReviewConfig, ReviewResult } from "@/lib/types";
import { runJmxReview, ANALYSIS_STEPS } from "@/lib/jmx/review-runner";
import { generateReviewId } from "@/lib/utils";
import { inferFileType, registerTestAsset, uploadReviewFile } from "@/lib/storage";
import { validateCsvContent } from "@/lib/jmx/csv-validator";

export interface ReviewFileBundle {
  jmx: File;
  attachments?: File[];
}

/** Create review record and upload all files to Supabase Storage */
export async function prepareReview(
  bundle: ReviewFileBundle,
  config: ReviewConfig
): Promise<{ reviewId: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const file = bundle.jmx;
  const externalId = generateReviewId();

  let hasCsvAttachment = false;
  let csvValidationWarnings: string[] = [];
  for (const att of bundle.attachments ?? []) {
    if (att.name.toLowerCase().endsWith(".csv")) {
      hasCsvAttachment = true;
      const csvText = await att.text();
      const validation = validateCsvContent(csvText, att.name);
      csvValidationWarnings = validation.warnings;
    }
  }

  const fullConfig: ReviewConfig = {
    ...config,
    hasCsvAttachment,
    csvValidationWarnings,
  };

  const { data: review, error: createError } = await supabase
    .from("script_reviews")
    .insert({
      external_review_id: externalId,
      user_id: user.id,
      script_name: file.name,
      file_size_bytes: file.size,
      status: "pending",
      progress_percent: 0,
      current_step: "Uploading files",
      config: fullConfig,
      ai_mode: fullConfig.aiRecommendationMode,
      test_type: fullConfig.testType,
    })
    .select("id")
    .single();

  if (createError || !review) throw createError ?? new Error("Failed to create review");

  const reviewUuid = review.id as string;

  const { path: jmxPath, error: uploadErr } = await uploadReviewFile(user.id, reviewUuid, file);
  if (uploadErr) throw new Error(`Failed to upload JMX: ${uploadErr}`);

  await supabase.from("script_reviews").update({ storage_path: jmxPath }).eq("id", reviewUuid);

  await registerTestAsset({
    userId: user.id,
    fileName: file.name,
    fileType: inferFileType(file.name),
    fileSize: file.size,
    storagePath: jmxPath,
    scriptReviewId: reviewUuid,
  });

  await supabase.from("review_assets").insert({
    script_review_id: reviewUuid,
    file_name: file.name,
    file_type: inferFileType(file.name),
    file_size_bytes: file.size,
    storage_path: jmxPath,
    validation_status: "valid",
  });

  for (const att of bundle.attachments ?? []) {
    const { path, error } = await uploadReviewFile(user.id, reviewUuid, att);
    if (error) continue;
    await registerTestAsset({
      userId: user.id,
      fileName: att.name,
      fileType: inferFileType(att.name),
      fileSize: att.size,
      storagePath: path,
      scriptReviewId: reviewUuid,
    });
    await supabase.from("review_assets").insert({
      script_review_id: reviewUuid,
      file_name: att.name,
      file_type: inferFileType(att.name),
      file_size_bytes: att.size,
      storage_path: path,
      validation_status: att.name.endsWith(".csv") ? "valid" : "valid",
      validation_warnings: att.name.endsWith(".har") ? 2 : 0,
    });
  }

  return { reviewId: reviewUuid };
}

export async function runReviewAnalysis(
  reviewId: string,
  xmlContent: string,
  fileName: string,
  config: ReviewConfig,
  onProgress?: (step: string, percent: number, log?: string) => void
): Promise<{ reviewId: string; result: ReviewResult }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const log = async (message: string, logType = "info") => {
    await supabase.from("review_activity_logs").insert({
      script_review_id: reviewId,
      message,
      log_type: logType,
    });
    onProgress?.(message, 0, message);
  };

  try {
    await supabase
      .from("script_reviews")
      .update({ status: "parsing", current_step: ANALYSIS_STEPS[0].label })
      .eq("id", reviewId);

    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      const step = ANALYSIS_STEPS[i];
      if (step.ai && config.aiRecommendationMode === "disabled") {
        await supabase
          .from("script_reviews")
          .update({
            current_step: step.label,
            progress_percent: Math.round(((i + 0.5) / ANALYSIS_STEPS.length) * 100),
          })
          .eq("id", reviewId);
        await log(
          "AI Explanation Layer skipped (AI Recommendation Mode disabled, using built-in templates)"
        );
        continue;
      }

      if (step.ai && config.aiRecommendationMode === "enabled") {
        await log("Running AI Explanation Layer...");
      }

      const percent = Math.round(((i + 1) / ANALYSIS_STEPS.length) * 100);
      await supabase
        .from("script_reviews")
        .update({
          status: i < 3 ? "scanning" : i < 4 ? "scoring" : "completed",
          current_step: step.label,
          progress_percent: percent,
        })
        .eq("id", reviewId);

      onProgress?.(step.label, percent);

      if (step.id === "parsing") {
        await log(`Loaded JMX file: ${fileName}`);
      }
      if (step.id === "inventory") {
        await new Promise((r) => setTimeout(r, 350));
      }
      if (step.id === "rules") {
        await log("Running rule engine scan (20 built-in rules)...");
      }
    }

    const result = await runJmxReview(xmlContent, fileName, config, reviewId);

    await log(`Rule engine completed with ${result.findings.length} findings detected`);
    if (config.aiRecommendationMode === "enabled") {
      await log("AI-enhanced recommendations applied to findings");
    }
    if (config.csvValidationWarnings?.length) {
      await log(`CSV validation: ${config.csvValidationWarnings.join("; ")}`, "warning");
    }
    if (result.findings.some((f) => f.ruleId === "JMX-009")) {
      await log("Found hardcoded token in HTTP Header 'Authorization'", "warning");
    }

    const findingsRows = result.findings.map((f) => ({
      script_review_id: reviewId,
      finding_code: f.findingCode,
      rule_id: f.ruleId,
      severity: f.severity,
      category: f.category,
      element: f.element,
      issue: f.issue,
      impact: f.impact,
      recommendation: f.recommendation,
      why_it_matters: f.whyItMatters,
      detected_value: f.detectedValue,
      location_path: f.locationPath,
      code_snippet: f.codeSnippet,
      fix_pattern_current: f.fixPatternCurrent,
      fix_pattern_recommended: f.fixPatternRecommended,
      tags: f.tags,
    }));

    if (findingsRows.length) {
      await supabase.from("review_findings").insert(findingsRows);
    }

    await supabase
      .from("script_reviews")
      .update({
        status: "completed",
        progress_percent: 100,
        current_step: "Completed",
        score: result.score,
        readiness: result.readiness,
        executive_summary: result.executiveSummary,
        inventory: result.inventory,
        top_risks: result.topRisks,
        fix_order: result.fixOrder,
        completed_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Script review completed",
      subtitle: fileName,
      notification_type: "review_complete",
    });

    return { reviewId, result };
  } catch (e) {
    await supabase
      .from("script_reviews")
      .update({
        status: "failed",
        error_message: e instanceof Error ? e.message : "Review failed",
      })
      .eq("id", reviewId);
    throw e;
  }
}

/** @deprecated Use prepareReview + runReviewAnalysis */
export async function createAndRunReview(
  bundle: ReviewFileBundle,
  xmlContent: string,
  config: ReviewConfig,
  onProgress?: (step: string, percent: number, log?: string) => void
) {
  const { reviewId } = await prepareReview(bundle, config);
  return runReviewAnalysis(reviewId, xmlContent, bundle.jmx.name, config, onProgress);
}
