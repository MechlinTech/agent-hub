import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchReportData,
} from "@/lib/reports/fetch-report";
import {
  generateHtmlReport,
  generateJsonReport,
  generateMarkdownReport,
} from "@/lib/reports/generator";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const format = new URL(request.url).searchParams.get("format") ?? "markdown";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await fetchReportData(id, user.id);
  if (!data) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const baseName = data.scriptName.replace(/\.jmx$/i, "");

  let body: string;
  let contentType: string;
  let fileName: string;

  switch (format) {
    case "html":
      body = generateHtmlReport(data);
      contentType = "text/html; charset=utf-8";
      fileName = `${baseName}-review-report.html`;
      break;
    case "json":
      body = generateJsonReport(data);
      contentType = "application/json; charset=utf-8";
      fileName = `${baseName}-review-report.json`;
      break;
    case "markdown":
    default:
      body = generateMarkdownReport(data);
      contentType = "text/markdown; charset=utf-8";
      fileName = `${baseName}-review-report.md`;
      break;
  }

  await supabase.from("report_exports").insert({
    script_review_id: id,
    user_id: user.id,
    format: format === "markdown" ? "markdown" : format,
    file_name: fileName,
  });

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
