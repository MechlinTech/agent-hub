import { TermsPage } from "@website/TermsPage";
import { getMarketingPageProps } from "@/lib/marketing-page-props";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use - Agent Hub",
  description: "Terms of Use for Agent Hub.",
};

export default async function TermsRoute() {
  const props = await getMarketingPageProps();
  return <TermsPage {...props} />;
}
