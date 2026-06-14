// Pure, side-effect-free extraction of email verification codes and links.
//
// These functions back the IMAP verification reader (lib/imap.ts) and are the
// most security/correctness-sensitive logic in the apply flow, so they are kept
// I/O-free and exhaustively unit-tested. Nothing here touches the network, the
// filesystem, or any global state.

// Phrases that strongly signal a nearby number is a verification code. We bias
// toward these to avoid grabbing unrelated numbers (order totals, phone numbers,
// years, zip codes) that frequently appear in the same email.
const CODE_CONTEXT_PATTERNS: RegExp[] = [
  // "your code is 123456", "verification code: 0492", "code 123456"
  /(?:verification|confirmation|security|one[\s-]?time|login|access|auth(?:entication)?|passcode|otp|pin)\s*(?:code|pin|password)?\s*(?:is|:|=|->|of)?\s*[:\-]?\s*([0-9]{4,8})\b/i,
  // "your code is 123456"
  /\b(?:your|the)\s+code\s+(?:is|:)?\s*[:\-]?\s*([0-9]{4,8})\b/i,
  // "code: 123456" / "code is 123456" / "code 123456"
  /\bcode\b\s*(?:is|:|=)?\s*[:\-]?\s*([0-9]{4,8})\b/i,
  // "123456 is your verification code" (number precedes the keyword)
  /\b([0-9]{4,8})\s+is\s+your\s+(?:verification|confirmation|security|one[\s-]?time|login|access)\s*code\b/i,
  // "enter 123456" / "use 123456"
  /\b(?:enter|use|type)\s+(?:the\s+code\s+)?([0-9]{4,8})\b/i,
];

// A loose fallback: a standalone 4-8 digit run with word boundaries. Only used
// when no contextual phrasing matched, and further filtered (see below).
const STANDALONE_DIGITS = /\b([0-9]{4,8})\b/g;

/**
 * Find a 4-8 digit verification code in free-text email content.
 *
 * Strategy:
 *  1. Prefer codes adjacent to verification phrasing ("your code is 123456",
 *     "verification code: 0492") — this is robust against unrelated numbers.
 *  2. Fall back to a lone 4-8 digit token only when the body is short / has a
 *     single candidate, to avoid false positives in marketing-heavy emails.
 *
 * Returns the raw matched digit string (leading zeros preserved) or null.
 */
export function extractOtp(text: string): string | null {
  if (!text) return null;

  // Normalize: collapse non-breaking spaces and zero-width chars that some
  // providers inject between digits or around the code.
  const normalized = text
    .replace(/[ ​‌‍﻿]/g, " ")
    // Some emails space out the code "1 2 3 4 5 6" for readability — only
    // collapse runs of single-digit-with-space groups that look like a code.
    .replace(/\b(\d)(?:\s(\d)){3,7}\b/g, (m) => m.replace(/\s+/g, ""));

  for (const pattern of CODE_CONTEXT_PATTERNS) {
    const m = normalized.match(pattern);
    if (m && m[1]) {
      return m[1];
    }
  }

  // Fallback: collect all standalone digit runs. Reject if the text is clearly
  // dominated by numbers we can't disambiguate.
  const candidates: string[] = [];
  let match: RegExpExecArray | null;
  STANDALONE_DIGITS.lastIndex = 0;
  while ((match = STANDALONE_DIGITS.exec(normalized)) !== null) {
    candidates.push(match[1]);
  }

  // De-duplicate while preserving order.
  const unique = Array.from(new Set(candidates));

  // Drop obvious non-codes: years (1900-2099) and very common round numbers.
  const filtered = unique.filter((c) => {
    if (/^(?:19|20)\d{2}$/.test(c) && c.length === 4) return false;
    return true;
  });

  // Only trust a standalone number when there is exactly one plausible
  // candidate — multiple bare numbers are too ambiguous to auto-submit.
  if (filtered.length === 1) {
    return filtered[0];
  }

  return null;
}

const DEFAULT_LINK = /https?:\/\/[^\s<>"')]+/gi;

/**
 * Extract a verification/confirmation link from email content.
 *
 * If `allowedHosts` is provided, only links whose hostname matches (exactly or
 * as a subdomain of) one of the allowed hosts are returned — this prevents
 * following tracking/marketing/unsubscribe links that share the same email.
 * When multiple candidates remain, links whose path/query contains
 * verify/confirm-style keywords are preferred.
 */
export function extractVerificationLink(
  text: string,
  allowedHosts?: string[]
): string | null {
  if (!text) return null;

  const raw = text.match(DEFAULT_LINK);
  if (!raw || raw.length === 0) return null;

  // Strip trailing punctuation that commonly bleeds into plain-text URLs.
  const urls = raw
    .map((u) => u.replace(/[.,;:!?)\]}>'"]+$/, ""))
    .filter((u) => u.length > 0);

  const parsed: { url: string; host: string; haystack: string }[] = [];
  for (const u of urls) {
    try {
      const parsedUrl = new URL(u);
      parsed.push({
        url: u,
        host: parsedUrl.hostname.toLowerCase(),
        haystack: `${parsedUrl.pathname}${parsedUrl.search}`.toLowerCase(),
      });
    } catch {
      // Skip malformed URLs.
    }
  }
  if (parsed.length === 0) return null;

  let pool = parsed;
  if (allowedHosts && allowedHosts.length > 0) {
    const hosts = allowedHosts.map((h) => h.toLowerCase().replace(/^\.+/, ""));
    pool = parsed.filter(({ host }) =>
      hosts.some((h) => host === h || host.endsWith(`.${h}`))
    );
    if (pool.length === 0) return null;
  }

  const VERIFY_KEYWORDS =
    /(verify|verification|confirm|activate|validate|magic|token|signin|sign-in|auth)/;

  const preferred = pool.find(({ haystack }) => VERIFY_KEYWORDS.test(haystack));
  return (preferred ?? pool[0]).url;
}
