"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StyledSelect } from "@/components/ui/StyledSelect";

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
  const options =
    packs.length > 0
      ? packs.map((p) => {
          const label = p.version ? `${p.name} ${p.version}` : p.name;
          return { value: label, label };
        })
      : [{ value: displayValue || "loading", label: value || "Loading..." }];

  return (
    <StyledSelect
      className="mt-1"
      value={displayValue || options[0]?.value || "loading"}
      onChange={onChange}
      options={options}
    />
  );
}
