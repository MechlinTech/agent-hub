import { PrivacyPage } from "@website/PrivacyPage";
import { getMarketingPageProps } from "@/lib/marketing-page-props";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Agent Hub",
  description: "Privacy Policy for Agent Hub by Mechlin Technologies.",
};

export default async function PrivacyRoute() {
  const props = await getMarketingPageProps();
  return <PrivacyPage {...props} />;
}
