import { getAuthContext } from "@/lib/supabase/get-auth-context";
import { requirePageRead } from "@/lib/permissions-guard";

export default async function ProjectSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthContext();
  if (auth) requirePageRead(auth, "project_setup");
  return children;
}
