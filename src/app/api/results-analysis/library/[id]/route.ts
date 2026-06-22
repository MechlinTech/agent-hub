import { NextResponse } from "next/server";
import {
  deleteExecutiveSummaryLibraryEntry,
  getExecutiveSummaryLibraryEntry,
  updateExecutiveSummaryLibraryEntry,
} from "@/lib/executive-summary-library-service-server";
import type { ScriptSummaryRow } from "@/lib/results-analysis/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entry = await getExecutiveSummaryLibraryEntry(id);
    if (!entry) {
      return NextResponse.json({ error: "Library entry not found" }, { status: 404 });
    }
    return NextResponse.json({ entry });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load library entry" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      bugId?: string;
      comments?: string;
      scriptSummaries?: ScriptSummaryRow[];
    };
    const entry = await updateExecutiveSummaryLibraryEntry(id, {
      bugId: body.bugId,
      comments: body.comments,
      scriptSummaries: body.scriptSummaries,
    });
    if (!entry) {
      return NextResponse.json({ error: "Library entry not found" }, { status: 404 });
    }
    return NextResponse.json({ entry });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update library entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const removed = await deleteExecutiveSummaryLibraryEntry(id);
    if (!removed) {
      return NextResponse.json({ error: "Library entry not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete library entry" },
      { status: 500 }
    );
  }
}
