// Profile API: the single "fill once" row the apply worker reuses.
//
//   GET  → current profile (or a typed { configured:false } when Supabase env
//          is missing, so the UI can degrade clearly instead of erroring).
//   PUT  → upsert the one profile row (same as POST).
//   POST → upsert the one profile row.
//
// Writes are guarded by a bearer CRON_SECRET OR a same-origin request. If
// CRON_SECRET is unset (local dev) the guard is skipped. This is a single-user
// app, so there is exactly one profile row; we upsert it by primary key.

import { NextResponse } from "next/server";
import { profileSchema } from "@/lib/profile-schema";
import { getFullProfile, hasSupabaseEnv } from "@/lib/ui-data";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// A write is allowed when there's no CRON_SECRET (local dev), the bearer token
// matches it, or the request is same-origin (the browser editor).
function authorizedWrite(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (secret && header === `Bearer ${secret}`) return true;

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host === host) return true;
    } catch {
      /* malformed origin → fall through */
    }
  }
  // Same-site fetches from our own UI set this; treat as same-origin.
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "same-origin" || fetchSite === "same-site") return true;

  // No secret configured at all → local dev, allow.
  return !secret;
}

export async function GET(): Promise<NextResponse> {
  const { configured, profile } = await getFullProfile();
  return NextResponse.json({ configured, profile });
}

async function upsert(request: Request): Promise<NextResponse> {
  if (!authorizedWrite(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error: "Supabase is not configured; profile was not saved.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const sb = supabaseAdmin();
    // Find the existing single row (if any) so we update it rather than
    // inserting duplicates.
    const { data: existing } = await sb.from("profile").select("id").limit(1).maybeSingle();

    const row = {
      ...(existing?.id ? { id: existing.id as string } : {}),
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      cv_json: parsed.data.cv_json,
      work_authorization: parsed.data.work_authorization,
      salary_expectation: parsed.data.salary_expectation ?? null,
      notice_period: parsed.data.notice_period ?? null,
      willing_to_relocate: parsed.data.willing_to_relocate,
      eeo_defaults: parsed.data.eeo_defaults,
    };

    const { data, error } = await sb.from("profile").upsert(row).select().single();
    if (error) throw error;
    return NextResponse.json({ ok: true, configured: true, profile: data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  return upsert(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  return upsert(request);
}
