// IMAP verification reader.
//
// When the apply worker drives a hosted computer-use session and the target ATS
// asks for an emailed verification code or link, this module polls the inbox
// for a recent matching message and extracts the code/link via the pure helpers
// in lib/apply/extract-otp.ts.
//
// Network code is isolated here and defensive: a hard timeout, optional
// from/subject filters, and a guaranteed connection close in `finally`.

import { ImapFlow, type FetchMessageObject } from "imapflow";
import { simpleParser } from "mailparser";
import { env } from "./env";
import { extractOtp, extractVerificationLink } from "./apply/extract-otp";

export interface FetchVerificationOptions {
  /** Only consider messages received at/after this time. */
  since: Date;
  /** Substring (case-insensitive) the From address must contain. */
  fromContains?: string;
  /** Substring (case-insensitive) the Subject must contain. */
  subjectContains?: string;
  /** Hosts to which a verification link must belong (passed through to extractVerificationLink). */
  allowedHosts?: string[];
  /** Overall wall-clock budget for polling. Default 90s. */
  timeoutMs?: number;
  /** Delay between inbox polls. Default 5s. */
  pollIntervalMs?: number;
}

export interface VerificationResult {
  otp: string | null;
  link: string | null;
  /** The raw text (or html-derived text) the code/link was extracted from. */
  raw: string;
}

const DEFAULT_TIMEOUT_MS = 90_000;
const DEFAULT_POLL_INTERVAL_MS = 5_000;

/**
 * Poll the configured IMAP inbox for the most recent message matching the
 * filters and received since `opts.since`, and return its extracted OTP/link.
 *
 * Returns the first matching message that yields an OTP or link, or `null` if
 * the timeout elapses with no usable match. Never throws on the happy path —
 * connection/parse failures are caught and surfaced as `null` after the
 * connection is closed.
 */
export async function fetchLatestVerification(
  opts: FetchVerificationOptions
): Promise<VerificationResult | null> {
  const { host, port, user, pass } = env.imap();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const pollIntervalMs = opts.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const deadline = Date.now() + timeoutMs;

  const client = new ImapFlow({
    host,
    port,
    secure: port === 993,
    auth: { user, pass },
    // Keep the library quiet; we do our own error handling.
    logger: false,
  });

  // ImapFlow emits 'error' on socket issues; swallow so an async error doesn't
  // become an unhandled rejection while we're between awaits.
  client.on("error", () => {
    /* handled via try/catch around operations */
  });

  try {
    await client.connect();

    while (Date.now() < deadline) {
      const result = await scanInbox(client, opts);
      if (result && (result.otp || result.link)) {
        return result;
      }
      // No usable message yet — wait, but never past the deadline.
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      await sleep(Math.min(pollIntervalMs, remaining));
    }
    return null;
  } catch {
    // Connection or protocol failure: treat as "no verification available".
    return null;
  } finally {
    try {
      await client.logout();
    } catch {
      // Best effort; force-close the underlying socket if logout failed.
      try {
        client.close();
      } catch {
        /* nothing more we can do */
      }
    }
  }
}

/**
 * Open INBOX, fetch recent messages since `opts.since`, and return the newest
 * matching one's extracted verification data (or null if none match yet).
 */
async function scanInbox(
  client: ImapFlow,
  opts: FetchVerificationOptions
): Promise<VerificationResult | null> {
  const lock = await client.getMailboxLock("INBOX");
  try {
    // SINCE has day granularity in IMAP; we additionally filter by exact
    // timestamp below to honor `since` precisely.
    const sinceDate = new Date(opts.since);
    const messages: FetchMessageObject[] = [];
    for await (const msg of client.fetch(
      { since: sinceDate },
      { envelope: true, source: true, internalDate: true }
    )) {
      messages.push(msg);
    }

    // Newest first.
    messages.sort((a, b) => internalTime(b) - internalTime(a));

    const fromNeedle = opts.fromContains?.toLowerCase();
    const subjNeedle = opts.subjectContains?.toLowerCase();

    for (const msg of messages) {
      if (internalTime(msg) < opts.since.getTime()) continue;

      const env_ = msg.envelope;
      if (subjNeedle) {
        const subject = (env_?.subject ?? "").toLowerCase();
        if (!subject.includes(subjNeedle)) continue;
      }
      if (fromNeedle) {
        const from = (env_?.from ?? [])
          .map((a) => `${a.name ?? ""} <${a.address ?? ""}>`)
          .join(" ")
          .toLowerCase();
        if (!from.includes(fromNeedle)) continue;
      }

      const raw = await extractText(msg);
      if (!raw) continue;

      const otp = extractOtp(raw);
      const link = extractVerificationLink(raw, opts.allowedHosts);
      if (otp || link) {
        return { otp, link, raw };
      }
    }

    return null;
  } finally {
    lock.release();
  }
}

/** Parse a fetched message's source into a single text haystack (text + html-as-text). */
async function extractText(msg: FetchMessageObject): Promise<string> {
  if (!msg.source) return "";
  try {
    const parsed = await simpleParser(msg.source);
    const parts = [parsed.subject ?? "", parsed.text ?? ""];
    if (parsed.html) {
      // Strip tags so URLs/codes embedded in HTML are reachable by the
      // plain-text extractors.
      parts.push(stripHtml(parsed.html));
    }
    return parts.filter(Boolean).join("\n");
  } catch {
    // Fall back to the raw bytes if parsing fails.
    return msg.source.toString("utf8");
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");
}

function internalTime(msg: FetchMessageObject): number {
  const d = msg.internalDate;
  return d ? new Date(d).getTime() : 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
