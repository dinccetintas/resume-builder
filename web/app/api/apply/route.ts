// Apply worker entrypoint.
//
// POST { applicationId } → drives the computer-use apply engine for one
// application and returns its outcome. Guarded by a bearer CRON_SECRET
// (Authorization: Bearer <secret>); if CRON_SECRET is unset (local dev), the
// guard is skipped.

import { NextResponse } from "next/server";
import { applyToJob } from "@/lib/apply/engine";

export const dynamic = "force-dynamic";
// Computer-use sessions are long-running.
export const maxDuration = 600;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // local dev — no secret configured
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let applicationId: unknown;
  try {
    const body = (await request.json()) as { applicationId?: unknown };
    applicationId = body.applicationId;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (typeof applicationId !== "string" || applicationId.length === 0) {
    return NextResponse.json({ error: "applicationId required" }, { status: 400 });
  }

  try {
    const result = await applyToJob({ applicationId });
    const httpStatus = result.status === "failed" ? 500 : 200;
    return NextResponse.json({ ok: result.status !== "failed", ...result }, { status: httpStatus });
  } catch (err) {
    return NextResponse.json(
      { ok: false, status: "failed", error: String(err) },
      { status: 500 }
    );
  }
}
