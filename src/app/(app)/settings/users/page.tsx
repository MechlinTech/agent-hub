import { redirect } from "next/navigation";
import { UsersAdminPanel } from "@/components/admin/UsersAdminPanel";
import { getAuthContext } from "@/lib/supabase/get-auth-context";

export default async function UsersAdminPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  return <UsersAdminPanel currentUserId={auth.userId} />;
}
