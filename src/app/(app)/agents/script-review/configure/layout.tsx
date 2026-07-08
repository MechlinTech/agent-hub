import { getAuthContext } from "@/lib/supabase/get-auth-context";
import { requirePageWrite } from "@/lib/permissions-guard";

export default async function ScriptReviewConfigureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthContext();
  if (auth) requirePageWrite(auth, "script_review");
  return children;
}
