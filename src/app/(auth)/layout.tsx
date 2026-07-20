import { redirect } from "next/navigation";
import { isProductEnabled } from "@/lib/product-enabled";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  if (!isProductEnabled()) redirect("/");

  return (
    <div className="safe-top safe-bottom flex min-h-[100dvh] items-center justify-center app-shell-bg p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
