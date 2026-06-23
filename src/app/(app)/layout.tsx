import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/supabase/get-auth-context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, team_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <AppShell
      user={user}
      profile={profile}
      role={auth.role}
      overrides={auth.overrides}
      access={auth.access}
    >
      {children}
    </AppShell>
  );
}
