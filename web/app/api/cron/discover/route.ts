// Cron entrypoint: run job discovery.
//
// Guarded by a bearer CRON_SECRET (Authorization: Bearer <secret>). If CRON_SECRET
// is unset (local dev), the guard is skipped. Returns JSON with the insert count.

import { NextResponse } from "next/server";
import { runDiscovery } from "@/lib/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // local dev — no secret configured
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request): Promise<NextResponse> {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runDiscovery();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}
