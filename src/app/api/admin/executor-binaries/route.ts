import { NextResponse } from "next/server";
import { requireAdminOrSuperAdmin } from "@/lib/supabase/get-auth-context";
import {
  listExecutorBinaries,
  registerExecutorBinary,
} from "@/lib/executor-binaries-service-server";

export async function GET() {
  const { response } = await requireAdminOrSuperAdmin();
  if (response) return response;

  try {
    const binaries = await listExecutorBinaries();
    return NextResponse.json({ binaries });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load executor binaries" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { response } = await requireAdminOrSuperAdmin();
  if (response) return response;

  try {
    const body = (await request.json()) as {
      name?: string;
      version?: string;
      path?: string;
    };

    const binary = await registerExecutorBinary({
      name: body.name ?? "",
      version: body.version ?? "",
      path: body.path ?? "",
    });

    return NextResponse.json({ binary });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to register executor binary" },
      { status: 500 },
    );
  }
}
