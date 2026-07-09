"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buildExecutorBinaryStoragePath } from "@/lib/executor-binaries-shared";
import { cn } from "@/lib/utils";

interface ExecutorBinary {
  id: string;
  name: string;
  version: string;
  path: string;
  createdAt: string;
}

const BUCKET = "executor_binaries";

export function ExecutorBinaryUploadPanel() {
  const [binaries, setBinaries] = useState<ExecutorBinary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [version, setVersion] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadBinaries = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/executor-binaries");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to load executor builds");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { binaries: ExecutorBinary[] };
    setBinaries(data.binaries ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadBinaries();
  }, [loadBinaries]);

  async function handleUpload() {
    if (!file) {
      setError("Choose an installer file first.");
      return;
    }
    const trimmedVersion = version.trim().replace(/^v/i, "");
    if (!trimmedVersion) {
      setError("Enter a version (e.g. 1.1.0).");
      return;
    }

    const displayName = name.trim() || file.name;
    const storagePath = buildExecutorBinaryStoragePath(
      trimmedVersion,
      file.name,
    );

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, file, {
          upsert: true,
          contentType: file.type || "application/octet-stream",
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const res = await fetch("/api/admin/executor-binaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName,
          version: trimmedVersion,
          path: storagePath,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to register build");
      }

      setSuccess(
        `Published v${trimmedVersion}. Users on older builds will see the update banner.`,
      );
      setVersion("");
      setName("");
      setFile(null);
      await loadBinaries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(binary: ExecutorBinary) {
    if (
      !window.confirm(
        `Delete "${binary.name}" (v${binary.version})? This removes the installer from storage.`,
      )
    ) {
      return;
    }

    setDeletingId(binary.id);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/executor-binaries/${binary.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete build");
      }
      setSuccess(`Deleted v${binary.version}.`);
      await loadBinaries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="rounded-t-3xl border-b border-slate-100 bg-v-50/50 px-5 py-4">
        <p className="font-semibold text-slate-900">AgentHub Desktop builds</p>
        <p className="mt-1 text-sm text-slate-600">
          Upload a new installer (.exe or .msi). The most recently uploaded
          build becomes the latest version, and users on older executors will
          get a download link in the Local Executor banner.
        </p>
      </div>

      <div className="space-y-4 p-5">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Version
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.1.0"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Display name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="AgentHub Desktop 1.1.0 (Windows)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Installer file
          </label>
          <input
            type="file"
            accept=".exe,.msi,application/octet-stream"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
          {file ? (
            <p className="mt-1 text-xs text-slate-500">
              {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !file}
          className="btn-primary inline-flex items-center gap-2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Uploading…" : "Upload build"}
        </button>

        <div className="border-t border-slate-100 pt-4">
          <p className="mb-3 text-sm font-medium text-slate-800">
            Published builds
          </p>
          {loading ? (
            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ) : binaries.length === 0 ? (
            <p className="text-sm text-slate-500">No builds uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {binaries.map((binary) => (
                <li
                  key={binary.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/40 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">
                      {binary.name}{" "}
                      <span className="text-slate-500">v{binary.version}</span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {binary.path}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/api/admin/executor-binaries/${binary.id}/download`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(binary)}
                      disabled={deletingId === binary.id}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50",
                      )}
                    >
                      {deletingId === binary.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
