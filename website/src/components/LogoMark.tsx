export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="agent-hub-bg" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6d28d9" />
          <stop offset="1" stopColor="#9333ea" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#agent-hub-bg)" />
      <circle cx="16" cy="16" r="8" stroke="white" strokeWidth="1.15" opacity="0.22" />
      <g stroke="white" strokeWidth="1.75" strokeLinecap="round">
        <line x1="16" y1="6.5" x2="16" y2="10.5" opacity="0.85" />
        <line x1="16" y1="21.5" x2="16" y2="25.5" opacity="0.45" />
        <line x1="6.5" y1="16" x2="10.5" y2="16" opacity="0.55" />
        <line x1="21.5" y1="16" x2="25.5" y2="16" opacity="0.55" />
      </g>
      <circle cx="16" cy="6.5" r="1.55" fill="white" opacity="0.8" />
      <circle cx="16" cy="16" r="3.5" fill="white" />
    </svg>
  );
}
