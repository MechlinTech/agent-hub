"use client";

import { Download } from "lucide-react";
import { getSignedDownloadUrl } from "@/lib/storage";

export function TestAssetDownloadButton({
  path,
  fileName,
}: {
  path: string;
  fileName: string;
}) {
  async function handleDownload() {
    try {
      const url = await getSignedDownloadUrl(path);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
    } catch {
      alert("Download failed. File may no longer exist.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex items-center gap-1 text-brand-600 hover:underline"
    >
      <Download className="h-3 w-3" />
      Download
    </button>
  );
}
