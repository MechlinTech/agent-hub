import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "./LogoMark";

type SiteFooterProps = {
  productEnabled: boolean;
  isAuthenticated: boolean;
};

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-indigo-800/70 transition hover:text-brand-600"
    >
      {children}
    </Link>
  );
}

export function SiteFooter({ productEnabled, isAuthenticated }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-indigo-950/5 bg-white/60 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-3">
              <LogoMark className="h-8 w-8 shrink-0" />
              <div>
                <p className="font-semibold text-indigo-950">Agent Hub</p>
                <p className="text-sm text-indigo-800/60">Performance engineering workspace</p>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-indigo-800/55">
              AI agents for JMeter script review, BlazeMeter results analysis, and Dev Scaffold on
              your machine.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-950/80">
              Product
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <FooterLink href="/#agents">Agents</FooterLink>
              </li>
              <li>
                <FooterLink href="/#how-it-works">How it works</FooterLink>
              </li>
              <li>
                <FooterLink href="/#faq">FAQ</FooterLink>
              </li>
              {productEnabled && !isAuthenticated && (
                <>
                  <li>
                    <FooterLink href="/login">Log in</FooterLink>
                  </li>
                  <li>
                    <FooterLink href="/signup">Sign up</FooterLink>
                  </li>
                </>
              )}
              {productEnabled && isAuthenticated && (
                <li>
                  <FooterLink href="/dashboard">Dashboard</FooterLink>
                </li>
              )}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-950/80">
              Company
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <FooterLink href="/about">About</FooterLink>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-950/80">
              Legal
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <FooterLink href="/privacy">Privacy</FooterLink>
              </li>
              <li>
                <FooterLink href="/terms">Terms</FooterLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-indigo-950/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-indigo-800/50">
            © {year} Mechlin Technologies. All rights reserved.
          </p>
          <p className="text-sm text-indigo-800/45">agenthub.mechlintech.com</p>
        </div>
      </div>
    </footer>
  );
}
