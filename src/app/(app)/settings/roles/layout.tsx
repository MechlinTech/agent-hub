import { getAuthContext } from "@/lib/supabase/get-auth-context";
import { requirePageWrite } from "@/lib/permissions-guard";

export default async function RolePermissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthContext();
  if (auth) requirePageWrite(auth, "users");
  return children;
}
