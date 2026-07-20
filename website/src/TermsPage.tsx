import { TERMS_OF_USE } from "./content/terms";
import { LegalDocument } from "./components/LegalDocument";
import { MarketingShell } from "./components/MarketingShell";

export type TermsPageProps = {
  productEnabled: boolean;
  isAuthenticated: boolean;
};

export function TermsPage({ productEnabled, isAuthenticated }: TermsPageProps) {
  return (
    <MarketingShell productEnabled={productEnabled} isAuthenticated={isAuthenticated}>
      <LegalDocument {...TERMS_OF_USE} />
    </MarketingShell>
  );
}
