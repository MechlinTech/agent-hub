import { createClient } from "@/lib/supabase/client";

const BUCKET = "script-assets";

export function buildStoragePath(userId: string, reviewId: string, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${reviewId}/${safe}`;
}

export async function uploadReviewFile(
  userId: string,
  reviewId: string,
  file: File
): Promise<{ path: string; error?: string }> {
  const supabase = createClient();
  const path = buildStoragePath(userId, reviewId, file.name);

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || "application/octet-stream",
  });

  if (error) return { path, error: error.message };
  return { path };
}

export async function registerTestAsset(params: {
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  scriptReviewId?: string;
}) {
  const supabase = createClient();
  return supabase.from("test_assets").insert({
    user_id: params.userId,
    file_name: params.fileName,
    file_type: params.fileType,
    file_size_bytes: params.fileSize,
    storage_path: params.storagePath,
    script_review_id: params.scriptReviewId ?? null,
  });
}

export async function getSignedDownloadUrl(path: string, expiresIn = 3600) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export function inferFileType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    jmx: "JMX Script",
    csv: "CSV Data",
    properties: "Properties",
    yaml: "YAML Config",
    yml: "YAML Config",
    har: "HAR File",
    pdf: "SLA Document",
    docx: "SLA Document",
  };
  return map[ext ?? ""] ?? "Attachment";
}
