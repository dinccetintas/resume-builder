// Pipeline orchestration: discovery and tailoring.
//
//   runDiscovery()  — pull jobs from Adzuna + curated ATS boards, dedupe, rank,
//                     upsert into `jobs`, and create `matched` applications for
//                     high-value roles. Idempotent.
//   runTailoring()  — for `matched` applications, tailor the CV, render docx/pdf,
//                     upload to Storage, and advance the application to `tailored`.
//                     Per-job try/catch isolates failures.
//
// Both write structured progress to `run_logs`. These run server-side only
// (service-role Supabase client).

import type { SupabaseClient } from "@supabase/supabase-js";
import { PIPELINE_CONFIG } from "./config";
import { discoverAdzuna } from "./discover/adzuna";
import { discoverAts } from "./discover/ats";
import { isHighValue, rankJob } from "./rank";
import { renderCv } from "./render-client";
import { supabaseAdmin } from "./supabase";
import { tailorForJob } from "./tailor";
import type { Job } from "./types";

const STORAGE_BUCKET = "cv-docs";

type LogLevel = "info" | "warn" | "error";

/** Best-effort run log; never throws (logging must not break a run). */
async function log(
  db: SupabaseClient,
  stage: string,
  level: LogLevel,
  message: string,
  payload?: Record<string, unknown>,
  jobId?: string,
): Promise<void> {
  try {
    await db.from("run_logs").insert({
      stage,
      level,
      message,
      job_id: jobId ?? null,
      payload: payload ?? null,
    });
  } catch (err) {
    // Logging is best-effort — surface to stderr but don't propagate.
    console.error(`run_logs insert failed (${stage}/${message}):`, err);
  }
}

function dedupeJobs(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  const out: Job[] = [];
  for (const job of jobs) {
    const key = `${job.source}:${job.externalId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(job);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

export async function runDiscovery(): Promise<{ inserted: number }> {
  const db = supabaseAdmin();
  await log(db, "discovery", "info", "Discovery started");

  const collected: Job[] = [];

  // Adzuna: one query per search term across the configured countries.
  for (const term of PIPELINE_CONFIG.searchTerms) {
    try {
      const jobs = await discoverAdzuna({
        what: term,
        countries: PIPELINE_CONFIG.adzunaCountries,
      });
      collected.push(...jobs);
    } catch (err) {
      await log(db, "discovery", "warn", `Adzuna query failed: ${term}`, {
        error: String(err),
      });
    }
  }

  // ATS boards (failures are isolated inside discoverAts already).
  try {
    collected.push(...(await discoverAts(PIPELINE_CONFIG.atsTargets)));
  } catch (err) {
    await log(db, "discovery", "warn", "ATS discovery failed", {
      error: String(err),
    });
  }

  const jobs = dedupeJobs(collected);
  await log(db, "discovery", "info", `Collected ${jobs.length} unique jobs`, {
    raw: collected.length,
    unique: jobs.length,
  });

  let inserted = 0;
  for (const job of jobs) {
    try {
      const score = rankJob(job, PIPELINE_CONFIG.rank);

      // Upsert the job. On conflict (source, external_id) do nothing, but we
      // still want the row id back, so we read it after.
      const { error: upsertErr } = await db
        .from("jobs")
        .upsert(
          {
            source: job.source,
            external_id: job.externalId,
            title: job.title,
            company: job.company,
            location: job.location ?? null,
            country: job.country ?? null,
            jd_text: job.jdText ?? null,
            apply_url: job.applyUrl ?? null,
            ats: job.ats ?? null,
            score: score.total,
            score_breakdown: score,
          },
          { onConflict: "source,external_id", ignoreDuplicates: true },
        );
      if (upsertErr) {
        await log(db, "discovery", "warn", "Job upsert failed", {
          error: upsertErr.message,
          job: `${job.source}:${job.externalId}`,
        });
        continue;
      }
      inserted += 1;

      if (!isHighValue(score, PIPELINE_CONFIG.rank)) continue;

      // Fetch the job row id (whether just inserted or pre-existing).
      const { data: jobRow, error: selErr } = await db
        .from("jobs")
        .select("id")
        .eq("source", job.source)
        .eq("external_id", job.externalId)
        .maybeSingle();
      if (selErr || !jobRow) {
        await log(db, "discovery", "warn", "Could not resolve job id", {
          error: selErr?.message,
          job: `${job.source}:${job.externalId}`,
        });
        continue;
      }
      const jobId = jobRow.id as string;

      // Idempotently create a `matched` application. Skip if one already exists.
      const { data: existing } = await db
        .from("applications")
        .select("id")
        .eq("job_id", jobId)
        .maybeSingle();
      if (existing) continue;

      const { error: appErr } = await db
        .from("applications")
        .insert({ job_id: jobId, status: "matched" });
      if (appErr) {
        // A concurrent run may have inserted it; treat as benign.
        await log(db, "discovery", "info", "Application insert skipped", {
          reason: appErr.message,
          job_id: jobId,
        }, jobId);
      }
    } catch (err) {
      await log(db, "discovery", "error", "Unexpected error processing job", {
        error: String(err),
        job: `${job.source}:${job.externalId}`,
      });
    }
  }

  await log(db, "discovery", "info", `Discovery complete: ${inserted} jobs upserted`);
  return { inserted };
}

// ---------------------------------------------------------------------------
// Tailoring
// ---------------------------------------------------------------------------

interface MatchedApplication {
  id: string;
  job_id: string;
}

async function loadBaseCv(
  db: SupabaseClient,
): Promise<Record<string, unknown>> {
  const { data, error } = await db
    .from("profile")
    .select("cv_json")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to load profile.cv_json: ${error.message}`);
  if (!data || !data.cv_json) throw new Error("No profile.cv_json configured");
  return data.cv_json as Record<string, unknown>;
}

function decodeBase64(b64: string): Uint8Array {
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

export async function runTailoring(limit = 10): Promise<{ tailored: number }> {
  const db = supabaseAdmin();
  await log(db, "tailoring", "info", `Tailoring started (limit ${limit})`);

  let baseCv: Record<string, unknown>;
  try {
    baseCv = await loadBaseCv(db);
  } catch (err) {
    await log(db, "tailoring", "error", "Cannot start tailoring", {
      error: String(err),
    });
    throw err;
  }

  const { data: apps, error: appsErr } = await db
    .from("applications")
    .select("id, job_id")
    .eq("status", "matched")
    .limit(limit);
  if (appsErr) {
    await log(db, "tailoring", "error", "Failed to load matched applications", {
      error: appsErr.message,
    });
    throw new Error(appsErr.message);
  }

  const matched = (apps ?? []) as MatchedApplication[];
  let tailored = 0;

  for (const app of matched) {
    try {
      // Load the job for this application.
      const { data: job, error: jobErr } = await db
        .from("jobs")
        .select(
          "source, external_id, title, company, location, country, jd_text, apply_url, ats",
        )
        .eq("id", app.job_id)
        .maybeSingle();
      if (jobErr || !job) {
        throw new Error(`Job ${app.job_id} not found: ${jobErr?.message ?? "missing"}`);
      }

      const jobForTailor: Job = {
        source: job.source,
        externalId: job.external_id,
        title: job.title,
        company: job.company,
        location: job.location ?? undefined,
        country: job.country ?? undefined,
        jdText: job.jd_text ?? undefined,
        applyUrl: job.apply_url ?? undefined,
        ats: job.ats ?? undefined,
      };

      const result = await tailorForJob({ job: jobForTailor, baseCvJson: baseCv });

      const rendered = await renderCv(result.tailoredCvJson);

      const docxPath = `applications/${app.id}.docx`;
      const pdfPath = `applications/${app.id}.pdf`;

      const { error: docxUpErr } = await db.storage
        .from(STORAGE_BUCKET)
        .upload(docxPath, decodeBase64(rendered.docxBase64), {
          contentType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          upsert: true,
        });
      if (docxUpErr) throw new Error(`docx upload failed: ${docxUpErr.message}`);

      const { error: pdfUpErr } = await db.storage
        .from(STORAGE_BUCKET)
        .upload(pdfPath, decodeBase64(rendered.pdfBase64), {
          contentType: "application/pdf",
          upsert: true,
        });
      if (pdfUpErr) throw new Error(`pdf upload failed: ${pdfUpErr.message}`);

      const { error: updErr } = await db
        .from("applications")
        .update({
          status: "tailored",
          cv_docx_path: docxPath,
          cv_pdf_path: pdfPath,
          cover_letter: result.coverLetter,
          tailor_model: result.model,
          tailor_cost_usd: result.costUsd,
        })
        .eq("id", app.id);
      if (updErr) throw new Error(`application update failed: ${updErr.message}`);

      tailored += 1;
      await log(
        db,
        "tailoring",
        "info",
        `Tailored application ${app.id}`,
        { cost_usd: result.costUsd, model: result.model },
        app.job_id,
      );
    } catch (err) {
      // Isolate the failure: mark this application failed and keep going.
      await db
        .from("applications")
        .update({ status: "failed" })
        .eq("id", app.id);
      await log(
        db,
        "tailoring",
        "error",
        `Tailoring failed for application ${app.id}`,
        { error: String(err) },
        app.job_id,
      );
    }
  }

  await log(db, "tailoring", "info", `Tailoring complete: ${tailored} tailored`);
  return { tailored };
}
