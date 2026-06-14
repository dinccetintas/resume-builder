// Screening-answer-bank API: reusable answers the apply worker fuzzy-matches
// to unseen screening questions.
//
//   GET    → list all answers (or { configured:false } when Supabase is missing)
//   POST   → create one answer
//   PUT    → update one answer by id
//   DELETE → delete one answer by id
//
// Writes are guarded by a bearer CRON_SECRET OR a same-origin request; the
// guard is skipped when CRON_SECRET is unset (local dev). Single-user app:
// `owner` is left null and handled by RLS/service role (see TODO in report).

import { NextResponse } from "next/server";
import {
  screeningAnswerCreateSchema,
  screeningAnswerDeleteSchema,
  screeningAnswerUpdateSchema,
} from "@/lib/profile-schema";
import { hasSupabaseEnv, listScreeningAnswers } from "@/lib/ui-data";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "same-origin" || fetchSite === "same-site") return true;

  return !secret;
}

function guard(request: Request): NextResponse | null {
  if (!authorizedWrite(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error: "Supabase is not configured; change was not saved.",
      },
      { status: 503 },
    );
  }
  return null;
}

export async function GET(): Promise<NextResponse> {
  const { configured, answers } = await listScreeningAnswers();
  return NextResponse.json({ configured, answers });
}

export async function POST(request: Request): Promise<NextResponse> {
  const blocked = guard(request);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = screeningAnswerCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("screening_answers")
      .insert({
        question_key: parsed.data.question_key,
        match_terms: parsed.data.match_terms,
        answer: parsed.data.answer,
      })
      .select("id, question_key, match_terms, answer")
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, configured: true, answer: data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  const blocked = guard(request);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = screeningAnswerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("screening_answers")
      .update({
        question_key: parsed.data.question_key,
        match_terms: parsed.data.match_terms,
        answer: parsed.data.answer,
      })
      .eq("id", parsed.data.id)
      .select("id, question_key, match_terms, answer")
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, configured: true, answer: data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const blocked = guard(request);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = screeningAnswerDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const sb = supabaseAdmin();
    const { error } = await sb.from("screening_answers").delete().eq("id", parsed.data.id);
    if (error) throw error;
    return NextResponse.json({ ok: true, configured: true, id: parsed.data.id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
