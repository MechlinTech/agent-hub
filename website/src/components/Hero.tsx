import { Sparkles } from "lucide-react";
import { CtaButtons } from "./CtaButtons";
import { HeroVisual } from "./HeroVisual";

type HeroProps = {
  productEnabled: boolean;
  isAuthenticated: boolean;
};

export function Hero({ productEnabled, isAuthenticated }: HeroProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:pb-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-10">
        <div>
          <div className="brand-gradient mb-6 inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-float">
            <Sparkles className="h-4 w-4" />
            AI agents for performance engineering
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-indigo-950 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            Your performance engineering workspace, powered by agents
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-indigo-900/75 sm:text-xl">
            Review JMeter scripts, analyze BlazeMeter results, and scaffold
            projects on your machine-all from one hub built for load testing
            teams.
          </p>
          <div className="mt-10">
            <CtaButtons
              productEnabled={productEnabled}
              isAuthenticated={isAuthenticated}
              variant="hero"
            />
          </div>
          {!productEnabled && (
            <p className="mt-6 text-sm text-indigo-800/60">
              Agent Hub is in preview-only mode. Product access is currently
              disabled.
            </p>
          )}
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}
