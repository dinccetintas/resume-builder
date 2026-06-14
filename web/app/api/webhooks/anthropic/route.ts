// Anthropic webhook receiver.
//
// Receives Anthropic-delivered notifications (e.g. session/run state changes for
// a hosted computer-use session) and updates the matching application's status
// on completion. Verification lives in lib/apply/webhook-verify (route modules
// may only export route handlers).

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyWebhook } from "@/lib/apply/webhook-verify";

export const dynamic = "force-dynamic";

// Map terminal webhook event types onto application statuses.
const COMPLETED_EVENT_TYPES = new Set([
  "session.completed",
  "session.status_idled",
  "session.status_terminated",
]);

const FAILED_EVENT_TYPES = new Set(["session.failed", "session.error"]);

export async function POST(request: Request): Promise<NextResponse> {
  // Read the RAW body — re-serializing would change the bytes and break HMAC.
  const rawBody = await request.text();

  const verified = verifyWebhook(rawBody, request.headers);
  if (!verified.ok) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const payload = verified.payload ?? {};
  const eventType = payload.data?.type ?? payload.type ?? "";
  const applicationId = payload.data?.metadata?.applicationId;

  // Nothing to correlate — acknowledge so Anthropic stops retrying.
  if (!applicationId) {
    return NextResponse.json({ ok: true, ignored: "no_application_id" });
  }

  let nextStatus: "applied" | "failed" | null = null;
  if (COMPLETED_EVENT_TYPES.has(eventType)) nextStatus = "applied";
  else if (FAILED_EVENT_TYPES.has(eventType)) nextStatus = "failed";

  if (!nextStatus) {
    return NextResponse.json({ ok: true, ignored: eventType });
  }

  try {
    const sb = supabaseAdmin();
    const update: Record<string, unknown> = { status: nextStatus };
    if (nextStatus === "applied") update.applied_at = new Date().toISOString();
    await sb.from("applications").update(update).eq("id", applicationId);
    // Best-effort audit log (schema: stage/level/message/payload).
    await sb
      .from("run_logs")
      .insert({
        stage: "apply_webhook",
        level: nextStatus === "failed" ? "error" : "info",
        message: eventType,
        payload: { applicationId },
      })
      .then(undefined, () => {
        /* run_logs is best-effort */
      });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: nextStatus });
}
