import { getAuthContext } from "@/lib/supabase/get-auth-context";
import { requirePageRead } from "@/lib/permissions-guard";

export default async function SettingsProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthContext();
  if (auth) requirePageRead(auth, "settings");
  return children;
}
