import Link from "next/link";

type CtaButtonsProps = {
  productEnabled: boolean;
  isAuthenticated: boolean;
  variant?: "header" | "hero";
};

export function CtaButtons({
  productEnabled,
  isAuthenticated,
  variant = "header",
}: CtaButtonsProps) {
  if (!productEnabled) return null;

  const primaryClass =
    variant === "hero"
      ? "btn-primary px-6 py-3 text-base"
      : "btn-primary px-4 py-2 text-sm";

  const secondaryClass =
    variant === "hero"
      ? "btn-secondary px-6 py-3 text-base"
      : "btn-secondary px-4 py-2 text-sm";

  if (isAuthenticated) {
    return (
      <Link href="/dashboard" className={primaryClass}>
        Open dashboard
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href="/login" className={secondaryClass}>
        Log in
      </Link>
      <Link href="/signup" className={primaryClass}>
        Sign up
      </Link>
    </div>
  );
}
