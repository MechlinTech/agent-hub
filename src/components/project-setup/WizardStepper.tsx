"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardStep } from "@/stores/project-setup-store";

const STEPS = ["Configure", "Review", "Generate & Results"] as const;

export function WizardStepper({ currentStep }: { currentStep: WizardStep }) {
  return (
    <ol className="mb-6 flex w-full items-center">
      {STEPS.map((label, index) => {
        const stepNum = (index + 1) as WizardStep;
        const active = currentStep === stepNum;
        const done = currentStep > stepNum;

        return (
          <li
            key={label}
            className={cn("flex items-center", index < STEPS.length - 1 && "flex-1")}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  active && "bg-brand-600 text-white shadow-sm shadow-brand-600/25",
                  done && "bg-emerald-500 text-white",
                  !active && !done && "bg-slate-100 text-slate-400",
                )}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : stepNum}
              </span>
              <div className="hidden min-w-0 sm:block">
                <p
                  className={cn(
                    "truncate text-sm font-semibold",
                    active && "text-brand-800",
                    done && "text-slate-700",
                    !active && !done && "text-slate-400",
                  )}
                >
                  {label}
                </p>
              </div>
            </div>

            {index < STEPS.length - 1 ? (
              <div
                className={cn(
                  "mx-3 hidden h-0.5 min-w-[1.5rem] flex-1 rounded-full sm:block",
                  done ? "bg-emerald-300" : "bg-slate-200",
                )}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
