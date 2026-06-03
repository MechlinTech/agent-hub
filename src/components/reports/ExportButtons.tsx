"use client";

import { useState } from "react";
import { Download, FileJson, FileText, Printer } from "lucide-react";

export function ExportButtons({ reviewId, scriptName }: { reviewId: string; scriptName: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const base = scriptName.replace(/\.jmx$/i, "");

  async function download(format: "markdown" | "html" | "json") {
    setLoading(format);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/export?format=${format}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+)"/);
      const fileName = match?.[1] ?? `${base}-review-report.${format === "markdown" ? "md" : format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not export report. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function exportPdf() {
    setLoading("pdf");
    try {
      const res = await fetch(`/api/reviews/${reviewId}/export?format=html`);
      if (!res.ok) throw new Error("Export failed");
      const html = await res.text();
      const win = window.open("", "_blank");
      if (!win) {
        alert("Allow pop-ups to save as PDF via Print.");
        return;
      }
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 600);
    } catch {
      alert("Could not open print view for PDF.");
    } finally {
      setLoading(null);
    }
  }

  const btn =
    "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50";

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className={btn} disabled={!!loading} onClick={() => download("markdown")}>
        <FileText className="h-4 w-4" />
        {loading === "markdown" ? "..." : "Markdown"}
      </button>
      <button type="button" className={btn} disabled={!!loading} onClick={() => download("html")}>
        <Download className="h-4 w-4" />
        {loading === "html" ? "..." : "HTML"}
      </button>
      <button type="button" className={btn} disabled={!!loading} onClick={() => download("json")}>
        <FileJson className="h-4 w-4" />
        {loading === "json" ? "..." : "JSON"}
      </button>
      <button type="button" className={btn} disabled={!!loading} onClick={exportPdf}>
        <Printer className="h-4 w-4" />
        {loading === "pdf" ? "..." : "PDF (Print)"}
      </button>
    </div>
  );
}
