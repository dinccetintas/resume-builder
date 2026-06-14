// HMAC verification for inbound Anthropic webhooks. Kept out of the route file
// because Next.js route modules may only export route handlers.
//
// TODO — confirm/replace with the SDK verifier for live wiring. The Anthropic
// SDK ships `client.beta.webhooks.unwrap(rawBody, { headers })`, which verifies
// the signature, rejects replays older than ~5 minutes, and returns a typed
// event. Confirm the exact header name + signing scheme for this product's
// webhook before going live; until then this isolates verification behind a
// conservative HMAC-SHA256 check with a timing-safe comparison.

import crypto from "node:crypto";

export interface AnthropicWebhookPayload {
  type?: string;
  id?: string;
  data?: {
    type?: string;
    // We expect the dispatcher to thread our application id through metadata.
    metadata?: { applicationId?: string } | null;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

export interface VerifiedWebhook {
  ok: boolean;
  payload?: AnthropicWebhookPayload;
}

/**
 * Verify an inbound webhook against ANTHROPIC_WEBHOOK_SIGNING_KEY.
 * HMAC-SHA256 over the raw body, compared timing-safely against the signature
 * header. If no signing key is configured (local dev), verification is skipped.
 */
export function verifyWebhook(rawBody: string, headers: Headers): VerifiedWebhook {
  const secret = process.env.ANTHROPIC_WEBHOOK_SIGNING_KEY;

  if (secret) {
    const provided =
      headers.get("anthropic-signature") ??
      headers.get("webhook-signature") ??
      headers.get("x-anthropic-signature") ??
      "";
    if (!provided) return { ok: false };

    const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

    // Compare against each candidate token (some schemes send "v1,<sig>" lists).
    const candidates = provided
      .split(/[\s,]+/)
      .map((p) => p.replace(/^v1[=:]/i, "").trim())
      .filter(Boolean);

    const matched = candidates.some((cand) => timingSafeEqualHex(cand, expected));
    if (!matched) return { ok: false };
  }

  try {
    const payload = JSON.parse(rawBody) as AnthropicWebhookPayload;
    return { ok: true, payload };
  } catch {
    return { ok: false };
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}
