import { PRIVACY_POLICY } from "./content/privacy";
import { LegalDocument } from "./components/LegalDocument";
import { MarketingShell } from "./components/MarketingShell";

export type PrivacyPageProps = {
  productEnabled: boolean;
  isAuthenticated: boolean;
};

export function PrivacyPage({ productEnabled, isAuthenticated }: PrivacyPageProps) {
  return (
    <MarketingShell productEnabled={productEnabled} isAuthenticated={isAuthenticated}>
      <LegalDocument {...PRIVACY_POLICY} />
    </MarketingShell>
  );
}
