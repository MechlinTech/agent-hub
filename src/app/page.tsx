import { LandingPage } from "@website/LandingPage";
import { getMarketingPageProps } from "@/lib/marketing-page-props";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Hub - AI agents for performance engineering",
  description:
    "Review JMeter scripts, analyze BlazeMeter results, and scaffold projects with Agent Hub.",
};

export default async function HomePage() {
  const props = await getMarketingPageProps();
  return <LandingPage {...props} />;
}
