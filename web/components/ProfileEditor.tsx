"use client";

// Client editor for the single "fill once" profile row. Mirrors profileSchema
// (lib/profile-schema.ts): contact fields, per-country work authorization,
// salary / notice / relocation, plus the base CV — role + profile summary as
// dedicated inputs and the remaining CV JSON in an advanced textarea that is
// validated on save. Persists via PUT /api/profile and shows inline status.

import { useState } from "react";
import {
  WORK_AUTH_COUNTRIES,
  type WorkAuthCountry,
} from "@/lib/profile-schema";
import type { FullProfile } from "@/lib/ui-data";

const COUNTRY_LABELS: Record<WorkAuthCountry, string> = {
  US: "United States (US)",
  UK: "United Kingdom (UK)",
  NL: "Netherlands (NL)",
  AE: "United Arab Emirates (AE)",
  QA: "Qatar (QA)",
};

// Keys surfaced as dedicated CV inputs; the rest go to the advanced textarea.
const PROMOTED_CV_KEYS = ["role", "profile"] as const;

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

function splitCvJson(cv: Record<string, unknown>): {
  role: string;
  profile: string;
  rest: Record<string, unknown>;
} {
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(cv)) {
    if (!PROMOTED_CV_KEYS.includes(k as (typeof PROMOTED_CV_KEYS)[number])) {
      rest[k] = v;
    }
  }
  return {
    role: typeof cv.role === "string" ? cv.role : "",
    profile: typeof cv.profile === "string" ? cv.profile : "",
    rest,
  };
}

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-ink shadow-sm transition-colors duration-150 placeholder:text-muted focus:border-accent focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-accent";

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="font-serif text-xl text-ink">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function ProfileEditor({
  initialProfile,
  configured,
}: {
  initialProfile: FullProfile;
  configured: boolean;
}) {
  const split = splitCvJson(initialProfile.cv_json ?? {});

  const [fullName, setFullName] = useState(initialProfile.full_name ?? "");
  const [email, setEmail] = useState(initialProfile.email ?? "");
  const [phone, setPhone] = useState(initialProfile.phone ?? "");
  const [role, setRole] = useState(split.role);
  const [summary, setSummary] = useState(split.profile);
  const [advancedCv, setAdvancedCv] = useState(
    JSON.stringify(split.rest, null, 2),
  );
  const [advancedError, setAdvancedError] = useState<string | null>(null);
  const [workAuth, setWorkAuth] = useState<Record<string, string>>(
    initialProfile.work_authorization ?? {},
  );
  const [salary, setSalary] = useState(initialProfile.salary_expectation ?? "");
  const [notice, setNotice] = useState(initialProfile.notice_period ?? "");
  const [relocate, setRelocate] = useState(
    initialProfile.willing_to_relocate ?? true,
  );
  const [save, setSave] = useState<SaveState>({ kind: "idle" });

  function setCountry(country: WorkAuthCountry, value: string) {
    setWorkAuth((prev) => ({ ...prev, [country]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSave({ kind: "saving" });
    setAdvancedError(null);

    // Parse the advanced CV JSON and merge in the promoted fields.
    let rest: Record<string, unknown> = {};
    const trimmed = advancedCv.trim();
    if (trimmed) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Advanced CV must be a JSON object.");
        }
        rest = parsed as Record<string, unknown>;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Advanced CV is not valid JSON.";
        setAdvancedError(msg);
        setSave({ kind: "error", message: "Fix the advanced CV JSON to save." });
        return;
      }
    }

    const cv_json: Record<string, unknown> = { ...rest };
    if (role.trim()) cv_json.role = role.trim();
    if (summary.trim()) cv_json.profile = summary.trim();

    // Only include non-empty country entries (schema rejects unknown keys).
    const work_authorization: Record<string, string> = {};
    for (const c of WORK_AUTH_COUNTRIES) {
      const v = (workAuth[c] ?? "").trim();
      if (v) work_authorization[c] = v;
    }

    const body = {
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      cv_json,
      work_authorization,
      salary_expectation: salary.trim() || null,
      notice_period: notice.trim() || null,
      willing_to_relocate: relocate,
      eeo_defaults: initialProfile.eeo_defaults ?? {},
    };

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.configured === false) {
          setSave({
            kind: "error",
            message:
              "Supabase is not configured, so changes were not saved.",
          });
          return;
        }
        if (data?.error === "validation_error") {
          setSave({
            kind: "error",
            message: "Some fields are invalid. Check name, email and the CV JSON.",
          });
          return;
        }
        setSave({
          kind: "error",
          message: data?.error ? String(data.error) : `Save failed (${res.status}).`,
        });
        return;
      }
      setSave({ kind: "success", message: "Profile saved." });
    } catch {
      setSave({ kind: "error", message: "Network error while saving." });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {!configured ? (
        <div
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <strong className="font-semibold">Supabase is not configured.</strong>{" "}
          You can edit the form below, but changes will not be saved. Set
          <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">
            NEXT_PUBLIC_SUPABASE_URL
          </code>
          and
          <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">
            SUPABASE_SERVICE_ROLE_KEY
          </code>
          to enable persistence.
        </div>
      ) : null}

      <Card title="Contact" description="How employers reach you on every application.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="full_name" className="text-sm font-medium text-ink">
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium text-ink">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              autoComplete="tel"
            />
          </div>
        </div>
      </Card>

      <Card
        title="Work authorization"
        description="Per-country status the apply worker reads when answering eligibility questions."
      >
        <div className="space-y-4">
          {WORK_AUTH_COUNTRIES.map((c) => (
            <div key={c}>
              <label
                htmlFor={`wa_${c}`}
                className="text-sm font-medium text-ink"
              >
                {COUNTRY_LABELS[c]}
              </label>
              <input
                id={`wa_${c}`}
                name={`wa_${c}`}
                value={workAuth[c] ?? ""}
                onChange={(e) => setCountry(c, e.target.value)}
                placeholder="e.g. Requires sponsorship (H-1B)"
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Application preferences">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="salary" className="text-sm font-medium text-ink">
              Salary expectation
            </label>
            <input
              id="salary"
              name="salary"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="e.g. £120k–£150k base"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="notice" className="text-sm font-medium text-ink">
              Notice period
            </label>
            <input
              id="notice"
              name="notice"
              value={notice}
              onChange={(e) => setNotice(e.target.value)}
              placeholder="e.g. 1 month"
              className={inputClass}
            />
          </div>
        </div>
        <label className="mt-4 inline-flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={relocate}
            onChange={(e) => setRelocate(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-accent focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent"
          />
          Willing to relocate
        </label>
      </Card>

      <Card
        title="Base CV"
        description="The tailoring base. Role and summary are surfaced here; everything else lives in the advanced JSON."
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="role" className="text-sm font-medium text-ink">
              Role / title
            </label>
            <input
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. AI Engineer"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="summary" className="text-sm font-medium text-ink">
              Profile summary
            </label>
            <textarea
              id="summary"
              name="summary"
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="advanced_cv" className="text-sm font-medium text-ink">
              Advanced CV JSON
            </label>
            <p className="mt-0.5 text-xs text-muted">
              Remaining CV fields (experience, education, skills, links).
              Must be a JSON object.
            </p>
            <textarea
              id="advanced_cv"
              name="advanced_cv"
              rows={12}
              value={advancedCv}
              onChange={(e) => setAdvancedCv(e.target.value)}
              spellCheck={false}
              aria-invalid={advancedError ? true : undefined}
              aria-describedby={advancedError ? "advanced_cv_error" : undefined}
              className={`${inputClass} font-mono text-xs ${
                advancedError ? "border-red-400 focus:outline-red-500" : ""
              }`}
            />
            {advancedError ? (
              <p
                id="advanced_cv_error"
                role="alert"
                className="mt-1 text-xs text-red-700"
              >
                {advancedError}
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={save.kind === "saving"}
          className="inline-flex items-center rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {save.kind === "saving" ? "Saving…" : "Save profile"}
        </button>
        {save.kind === "success" ? (
          <p role="status" className="text-sm font-medium text-green-700">
            {save.message}
          </p>
        ) : null}
        {save.kind === "error" ? (
          <p role="alert" className="text-sm font-medium text-red-700">
            {save.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
