import { isProductEnabled } from "@/lib/product-enabled";
import { createClient } from "@/lib/supabase/server";

export type MarketingPageProps = {
  productEnabled: boolean;
  isAuthenticated: boolean;
};

export async function getMarketingPageProps(): Promise<MarketingPageProps> {
  const productEnabled = isProductEnabled();
  let isAuthenticated = false;

  if (productEnabled) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user?.email_confirmed_at);
  }

  return { productEnabled, isAuthenticated };
}
