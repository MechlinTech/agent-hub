import Link from "next/link";
import { LogoMark } from "./LogoMark";
import { CtaButtons } from "./CtaButtons";

type SiteHeaderProps = {
  productEnabled: boolean;
  isAuthenticated: boolean;
};

export function SiteHeader({ productEnabled, isAuthenticated }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark className="h-9 w-9 shrink-0" />
          <span className="text-lg font-bold tracking-tight text-indigo-950">Agent Hub</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-indigo-900/80 lg:gap-8 md:flex">
          <Link href="/#agents" className="transition hover:text-brand-600">
            Agents
          </Link>
          <Link href="/#how-it-works" className="transition hover:text-brand-600">
            How it works
          </Link>
          <Link href="/#faq" className="transition hover:text-brand-600">
            FAQ
          </Link>
          <Link href="/about" className="transition hover:text-brand-600">
            About
          </Link>
        </nav>
        <CtaButtons
          productEnabled={productEnabled}
          isAuthenticated={isAuthenticated}
          variant="header"
        />
      </div>
    </header>
  );
}
