import { LANDING_AGENTS } from "./content/agents";
import { LANDING_FAQ } from "./content/faq";
import { AgentShowcase } from "./components/AgentShowcase";
import { FaqSection } from "./components/FaqSection";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { MarketingShell } from "./components/MarketingShell";

export type LandingPageProps = {
  productEnabled: boolean;
  isAuthenticated: boolean;
};

export function LandingPage({ productEnabled, isAuthenticated }: LandingPageProps) {
  return (
    <MarketingShell productEnabled={productEnabled} isAuthenticated={isAuthenticated}>
      <Hero productEnabled={productEnabled} isAuthenticated={isAuthenticated} />
      <AgentShowcase agents={LANDING_AGENTS} />
      <HowItWorks />
      <FaqSection items={LANDING_FAQ} />
    </MarketingShell>
  );
}
