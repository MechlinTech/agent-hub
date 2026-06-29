"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { canAccessNavHref } from "@/lib/navigation-access";
import { usePermissions } from "@/lib/permissions-context";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: string;
  id: string;
  label: string;
  sub: string;
  href: string;
}

export function GlobalSearch({ variant = "default" }: { variant?: "default" | "nav" }) {
  const router = useRouter();
  const { canRead, canWrite } = usePermissions();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.results ?? []);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  const visibleResults = results.filter((r) => canAccessNavHref(r.href, canRead, canWrite));

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "nav"
            ? "flex w-48 items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-left ring-1 ring-white/15 transition-colors hover:bg-white/15 xl:w-56"
            : "mx-auto flex w-full max-w-xl items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2 text-left shadow-sm backdrop-blur-sm"
        }
      >
        <Search className={cn("h-4 w-4", variant === "nav" ? "text-white/70" : "text-slate-400")} />
        <span
          className={cn(
            "flex-1 truncate text-sm",
            variant === "nav" ? "text-white/60" : "text-slate-400",
          )}
        >
          Search...
        </span>
        <kbd
          className={cn(
            "hidden rounded border px-1.5 py-0.5 text-xs sm:inline",
            variant === "nav"
              ? "border-white/20 bg-white/10 text-white/50"
              : "border-slate-200 bg-white text-slate-400",
          )}
        >
          ⌘ K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh]">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reviews, scripts, assets..."
            className="flex-1 text-sm outline-none"
          />
          <button type="button" onClick={() => setOpen(false)}>
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <ul className="scrollbar-brand max-h-72 overflow-y-auto py-2">
          {visibleResults.map((r) => (
            <li key={`${r.type}-${r.id}`}>
              <button
                type="button"
                className="flex w-full flex-col px-4 py-2 text-left hover:bg-slate-50"
                onClick={() => {
                  router.push(r.href);
                  setOpen(false);
                }}
              >
                <span className="text-sm font-medium">{r.label}</span>
                <span className="text-xs text-slate-500">{r.sub}</span>
              </button>
            </li>
          ))}
          {query.length >= 2 && !visibleResults.length && (
            <li className="px-4 py-6 text-center text-sm text-slate-500">No results</li>
          )}
        </ul>
      </div>
    </div>
  );
}
