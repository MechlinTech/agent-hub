import { AboutPage } from "@website/AboutPage";
import { getMarketingPageProps } from "@/lib/marketing-page-props";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About - Agent Hub",
  description: "Learn about Agent Hub and its AI agents for performance engineering.",
};

export default async function AboutRoute() {
  const props = await getMarketingPageProps();
  return <AboutPage {...props} />;
}
