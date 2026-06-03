"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function RulePackSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [packs, setPacks] = useState<{ name: string; version: string | null }[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("rule_packs")
      .select("name, version")
      .order("is_default", { ascending: false })
      .then(({ data }) => {
        if (data?.length) {
          setPacks(data);
        }
      });
  }, []);

  const displayValue = value || (packs[0] ? `${packs[0].name}${packs[0].version ? ` ${packs[0].version}` : ""}` : "");

  return (
    <select
      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
      value={displayValue}
      onChange={(e) => onChange(e.target.value)}
    >
      {packs.map((p) => {
        const label = p.version ? `${p.name} ${p.version}` : p.name;
        return (
          <option key={label} value={label}>
            {label}
          </option>
        );
      })}
      {!packs.length && <option value={value}>{value || "Loading..."}</option>}
    </select>
  );
}
