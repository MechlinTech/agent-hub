import { getAuthContext } from "@/lib/supabase/get-auth-context";
import { requirePageRead } from "@/lib/permissions-guard";

export default async function ResultsAnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthContext();
  if (auth) requirePageRead(auth, "results_analysis");
  return children;
}
