"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { FaqItem } from "../content/faq";

type FaqSectionProps = {
  items: FaqItem[];
};

export function FaqSection({ items }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">FAQ</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-indigo-950 sm:text-4xl">
          Common questions
        </h2>
        <p className="mt-4 text-indigo-900/70">
          Everything you need to know before rolling Agent Hub out to your performance team.
        </p>
        <ul className="mt-10 space-y-3">
          {items.map((item, index) => {
            const open = openIndex === index;
            return (
              <li
                key={item.question}
                className="overflow-hidden rounded-2xl border border-white/80 bg-white/75 shadow-card ring-1 ring-indigo-950/5"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={open}
                >
                  <span className="font-semibold text-indigo-950">{item.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-brand-600 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {open && (
                  <div className="border-t border-indigo-950/5 px-5 pb-4 pt-1">
                    <p className="text-sm leading-relaxed text-indigo-900/75">{item.answer}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
