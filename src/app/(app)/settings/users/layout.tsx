import { getAuthContext } from "@/lib/supabase/get-auth-context";
import { requirePageRead } from "@/lib/permissions-guard";

export default async function SettingsUsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthContext();
  if (auth) requirePageRead(auth, "users");
  return children;
}
