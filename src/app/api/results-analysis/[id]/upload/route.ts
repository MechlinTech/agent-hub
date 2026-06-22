import { NextResponse } from "next/server";
import { uploadResultsFiles } from "@/lib/results-analysis-service-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const form = await request.formData();
    const files: Record<string, { name: string; buffer: Buffer }> = {};

    const mapping: Record<string, string> = {
      requestStats: "requestStats",
      errorStats: "errorStats",
      timeline: "timeline",
      baseline: "baseline",
      jtl: "jtl",
    };

    for (const [formKey, targetKey] of Object.entries(mapping)) {
      const value = form.get(formKey);
      if (value instanceof File && value.size > 0) {
        files[targetKey] = {
          name: value.name,
          buffer: Buffer.from(await value.arrayBuffer()),
        };
      }
    }

    if (!files.requestStats) {
      return NextResponse.json({ error: "Request Stats CSV is required" }, { status: 400 });
    }

    const analysis = await uploadResultsFiles(id, files);
    return NextResponse.json({ analysis });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
