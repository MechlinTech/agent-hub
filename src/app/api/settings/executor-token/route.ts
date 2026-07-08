import { NextResponse } from "next/server";
import { requireWrite } from "@/lib/supabase/get-auth-context";
import {
  hasExecutorToken,
  regenerateExecutorToken,
} from "@/lib/project-setup-service-server";

export async function GET() {
  const { response } = await requireWrite("settings");
  if (response) return response;

  try {
    const hasToken = await hasExecutorToken();
    return NextResponse.json({ hasToken });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { response } = await requireWrite("settings");
  if (response) return response;

  try {
    const body = (await request.json().catch(() => ({}))) as { version?: string };
    const token = await regenerateExecutorToken(body.version ?? null);
    return NextResponse.json({ token });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate token" },
      { status: 500 }
    );
  }
}
