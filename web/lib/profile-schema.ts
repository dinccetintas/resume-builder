// Shared zod schemas for the profile + screening-answer-bank editor.
//
// These describe the request bodies accepted by /api/profile and
// /api/screening-answers, and are reused on the client for optimistic
// validation. The CV JSON mirrors cv.CVData.from_dict (see cv/data.py): the
// editor surfaces `role` + `profile` (summary) as first-class fields and keeps
// the rest as a free-form (but structurally-validated) object.

import { z } from "zod";

// Target countries the work-authorization map must cover. Kept explicit because
// each is legally distinct and the apply worker reads them by key.
export const WORK_AUTH_COUNTRIES = ["US", "UK", "NL", "AE", "QA"] as const;
export type WorkAuthCountry = (typeof WORK_AUTH_COUNTRIES)[number];

// The structured CV used as the tailoring base. We validate the shape loosely
// (tolerant of extra/missing keys, like CVData.from_dict) while requiring the
// two fields the editor promotes to dedicated inputs.
export const cvJsonSchema = z
  .object({
    name: z.string().optional(),
    role: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    linkedin_url: z.string().optional(),
    github_url: z.string().optional(),
    profile: z.string().optional(),
  })
  .passthrough();

export type CvJson = z.infer<typeof cvJsonSchema>;

// Per-country work authorization. Every country key is optional, but unknown
// keys are rejected to keep the map aligned with what the worker expects.
export const workAuthorizationSchema = z
  .object(
    Object.fromEntries(
      WORK_AUTH_COUNTRIES.map((c) => [c, z.string().max(500).optional()]),
    ) as Record<WorkAuthCountry, z.ZodOptional<z.ZodString>>,
  )
  .strict();

export type WorkAuthorization = z.infer<typeof workAuthorizationSchema>;

export const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("A valid email is required").max(320),
  phone: z.string().max(50).optional().nullable(),
  cv_json: cvJsonSchema,
  work_authorization: workAuthorizationSchema.default({}),
  salary_expectation: z.string().max(200).optional().nullable(),
  notice_period: z.string().max(200).optional().nullable(),
  willing_to_relocate: z.boolean().default(true),
  eeo_defaults: z.record(z.string(), z.unknown()).default({}),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// --- Screening answers ----------------------------------------------------

export const screeningAnswerBaseSchema = z.object({
  question_key: z
    .string()
    .min(1, "A question key is required")
    .max(120)
    .regex(
      /^[a-z0-9_]+$/,
      "Use lowercase letters, numbers and underscores (e.g. years_python)",
    ),
  match_terms: z.array(z.string().min(1).max(80)).max(50).default([]),
  answer: z.string().min(1, "An answer is required").max(4000),
});

export type ScreeningAnswerInput = z.infer<typeof screeningAnswerBaseSchema>;

export const screeningAnswerCreateSchema = screeningAnswerBaseSchema;

export const screeningAnswerUpdateSchema = screeningAnswerBaseSchema.extend({
  id: z.string().min(1),
});

export const screeningAnswerDeleteSchema = z.object({
  id: z.string().min(1),
});
