import { cn } from "@/lib/utils";

/** Compass Core mark — pair with `brand-gradient` container or use on purple backgrounds. */
export function AgentHubMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <circle
        cx="16"
        cy="16"
        r="8"
        stroke="currentColor"
        strokeWidth="1.15"
        opacity="0.22"
      />
      <g stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <line x1="16" y1="6.5" x2="16" y2="10.5" opacity="0.85" />
        <line x1="16" y1="21.5" x2="16" y2="25.5" opacity="0.45" />
        <line x1="6.5" y1="16" x2="10.5" y2="16" opacity="0.55" />
        <line x1="21.5" y1="16" x2="25.5" y2="16" opacity="0.55" />
      </g>
      <circle cx="16" cy="6.5" r="1.55" fill="currentColor" opacity="0.8" />
      <circle cx="16" cy="16" r="3.5" fill="currentColor" />
    </svg>
  );
}

const LOGO_SIZES = {
  sm: { box: "h-8 w-8", icon: "h-[18px] w-[18px]", rounded: "rounded-xl" },
  md: { box: "h-10 w-10", icon: "h-[22px] w-[22px]", rounded: "rounded-2xl" },
  lg: { box: "h-12 w-12", icon: "h-7 w-7", rounded: "rounded-2xl" },
} as const;

export function AgentHubLogo({
  size = "md",
  className,
}: {
  size?: keyof typeof LOGO_SIZES;
  className?: string;
}) {
  const config = LOGO_SIZES[size];

  return (
    <div
      className={cn(
        "brand-gradient flex shrink-0 items-center justify-center text-white shadow-sm shadow-brand-600/25",
        config.box,
        config.rounded,
        className,
      )}
    >
      <AgentHubMark className={config.icon} />
    </div>
  );
}
