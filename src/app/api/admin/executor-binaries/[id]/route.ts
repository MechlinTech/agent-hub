import { NextResponse } from "next/server";
import { requireAdminOrSuperAdmin } from "@/lib/supabase/get-auth-context";
import { deleteExecutorBinary } from "@/lib/executor-binaries-service-server";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { response } = await requireAdminOrSuperAdmin();
  if (response) return response;

  try {
    await deleteExecutorBinary(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete build" },
      { status: 500 },
    );
  }
}
