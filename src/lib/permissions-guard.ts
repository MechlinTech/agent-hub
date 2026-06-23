import { redirect } from "next/navigation";
import type { Resource } from "@/lib/permissions";
import { canRead, canWrite } from "@/lib/permissions";

interface AccessGuardInput {
  access: Record<Resource, import("@/lib/permissions").AccessLevel>;
}

export function requirePageRead({ access }: AccessGuardInput, resource: Resource) {
  if (!canRead(access, resource)) {
    redirect("/forbidden");
  }
}

export function requirePageWrite({ access }: AccessGuardInput, resource: Resource) {
  if (!canWrite(access, resource)) {
    redirect("/forbidden");
  }
}
