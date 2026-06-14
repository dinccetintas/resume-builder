// Shared domain types for the job pipeline. Mirror the Supabase schema.

export type JobSource =
  | "adzuna"
  | "greenhouse"
  | "lever"
  | "ashby"
  | "gulf"
  | "linkedin"
  | "manual";

export type Country = "UK" | "US" | "AE" | "QA" | "NL" | "OTHER";

export interface Job {
  source: JobSource;
  externalId: string;
  title: string;
  company: string;
  location?: string;
  country?: Country;
  remote?: boolean;
  jdText?: string;
  applyUrl?: string;
  ats?: string;
  postedAt?: string; // ISO
}

export interface ScoreBreakdown {
  seniority: number; // 0..1
  prestige: number; // 0..1
  fit: number; // 0..1
  total: number; // 0..100
  reasons: string[];
}

export type ApplicationStatus =
  | "matched"
  | "tailored"
  | "applying"
  | "applied"
  | "needs_manual"
  | "skipped"
  | "responded"
  | "failed";
