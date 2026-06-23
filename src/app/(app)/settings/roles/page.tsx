import { getAuthContext } from "@/lib/supabase/get-auth-context";
import { requirePageWrite } from "@/lib/permissions-guard";
import { RolePermissionsPanel } from "@/components/admin/RolePermissionsPanel";

export default async function RolePermissionsPage() {
  const auth = await getAuthContext();
  if (auth) requirePageWrite(auth, "users");
  return <RolePermissionsPanel />;
}
