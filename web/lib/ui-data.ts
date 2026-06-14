// Server-side read helpers for the dashboard UI.
//
// These are SELECT-only queries against Supabase. They degrade gracefully:
// if the Supabase env vars are missing (e.g. during `next build` without
// credentials) or any query throws, the helper returns realistic MOCK
// fixtures so pages still statically render. Import only on the server.

import type { ApplicationStatus, ScoreBreakdown } from "./types";

// --- UI-facing row shapes (mirror the actual Supabase table columns) ---

export interface JobRowData {
  id: string;
  source: string;
  title: string;
  company: string;
  location: string | null;
  country: string | null;
  score: number | null;
  score_breakdown: ScoreBreakdown | null;
  apply_url: string | null;
  ats: string | null;
  discovered_at: string; // ISO
}

export interface ApplicationRowData {
  id: string;
  job_id: string;
  status: ApplicationStatus;
  cv_pdf_path: string | null;
  cover_letter: string | null;
  tailor_cost_usd: number | null;
  manual_reason: string | null;
  manual_url: string | null;
  applied_at: string | null; // ISO
}

export interface ManualQueueItem {
  application: ApplicationRowData;
  job: JobRowData | null;
}

export interface ProfileSummary {
  contact: {
    name: string;
    email: string;
    phone: string;
    location: string;
    links: { label: string; url: string }[];
  };
  workAuthorization: { country: string; status: string }[];
  salaryExpectation: string;
  noticePeriod: string;
  cvSections: {
    summary: string;
    skills: string[];
    experience: { title: string; company: string; period: string; highlights: string[] }[];
    education: { degree: string; school: string; period: string }[];
  };
}

export interface FunnelCounts {
  discovered: number;
  matched: number;
  tailored: number;
  applied: number;
  needsManual: number;
  responded: number;
}

// --- Mock fixtures -------------------------------------------------------

const MOCK_JOBS: JobRowData[] = [
  {
    id: "job_1",
    source: "greenhouse",
    title: "Staff Machine Learning Engineer",
    company: "Anthropic",
    location: "London, UK",
    country: "UK",
    score: 94,
    score_breakdown: {
      seniority: 0.9,
      prestige: 0.98,
      fit: 0.95,
      total: 94,
      reasons: ["Strong LLM/RAG match", "Staff-level scope", "Top-tier lab"],
    },
    apply_url: "https://boards.greenhouse.io/anthropic/jobs/1",
    ats: "greenhouse",
    discovered_at: "2026-06-13T09:12:00.000Z",
  },
  {
    id: "job_2",
    source: "lever",
    title: "Senior Applied Scientist, LLMs",
    company: "Mistral AI",
    location: "Remote (EU)",
    country: "NL",
    score: 89,
    score_breakdown: {
      seniority: 0.85,
      prestige: 0.9,
      fit: 0.92,
      total: 89,
      reasons: ["Applied research fit", "Remote-friendly", "Strong comp band"],
    },
    apply_url: "https://jobs.lever.co/mistral/2",
    ats: "lever",
    discovered_at: "2026-06-13T11:40:00.000Z",
  },
  {
    id: "job_3",
    source: "ashby",
    title: "ML Platform Engineer",
    company: "Ramp",
    location: "New York, US",
    country: "US",
    score: 82,
    score_breakdown: {
      seniority: 0.8,
      prestige: 0.82,
      fit: 0.83,
      total: 82,
      reasons: ["Platform/infra match", "High-growth fintech"],
    },
    apply_url: "https://jobs.ashbyhq.com/ramp/3",
    ats: "ashby",
    discovered_at: "2026-06-12T16:05:00.000Z",
  },
  {
    id: "job_4",
    source: "linkedin",
    title: "AI Engineer, Agents",
    company: "Cohere",
    location: "Dubai, UAE",
    country: "AE",
    score: 78,
    score_breakdown: {
      seniority: 0.75,
      prestige: 0.8,
      fit: 0.79,
      total: 78,
      reasons: ["Agent tooling match", "Relocation support"],
    },
    apply_url: "https://www.linkedin.com/jobs/view/4",
    ats: "linkedin",
    discovered_at: "2026-06-12T08:20:00.000Z",
  },
  {
    id: "job_5",
    source: "adzuna",
    title: "Research Engineer, Alignment",
    company: "DeepMind",
    location: "London, UK",
    country: "UK",
    score: 91,
    score_breakdown: {
      seniority: 0.88,
      prestige: 0.97,
      fit: 0.9,
      total: 91,
      reasons: ["Alignment research fit", "Prestige employer"],
    },
    apply_url: "https://deepmind.com/careers/5",
    ats: "workday",
    discovered_at: "2026-06-11T14:00:00.000Z",
  },
  {
    id: "job_6",
    source: "gulf",
    title: "Lead Data Scientist",
    company: "QatarEnergy",
    location: "Doha, Qatar",
    country: "QA",
    score: 71,
    score_breakdown: {
      seniority: 0.82,
      prestige: 0.7,
      fit: 0.68,
      total: 71,
      reasons: ["Leadership scope", "Energy domain mismatch"],
    },
    apply_url: "https://careers.qatarenergy.qa/6",
    ats: "taleo",
    discovered_at: "2026-06-10T07:30:00.000Z",
  },
];

const MOCK_APPLICATIONS: ApplicationRowData[] = [
  {
    id: "app_1",
    job_id: "job_1",
    status: "applied",
    cv_pdf_path: "cvs/anthropic.pdf",
    cover_letter: "Tailored cover letter…",
    tailor_cost_usd: 0.12,
    manual_reason: null,
    manual_url: null,
    applied_at: "2026-06-13T10:00:00.000Z",
  },
  {
    id: "app_2",
    job_id: "job_5",
    status: "responded",
    cv_pdf_path: "cvs/deepmind.pdf",
    cover_letter: "Tailored cover letter…",
    tailor_cost_usd: 0.11,
    manual_reason: null,
    manual_url: null,
    applied_at: "2026-06-11T15:30:00.000Z",
  },
  {
    id: "app_3",
    job_id: "job_2",
    status: "tailored",
    cv_pdf_path: "cvs/mistral.pdf",
    cover_letter: "Tailored cover letter…",
    tailor_cost_usd: 0.1,
    manual_reason: null,
    manual_url: null,
    applied_at: null,
  },
  {
    id: "app_4",
    job_id: "job_4",
    status: "needs_manual",
    cv_pdf_path: "cvs/cohere.pdf",
    cover_letter: "Tailored cover letter…",
    tailor_cost_usd: 0.09,
    manual_reason: "LinkedIn Easy Apply requires manual login",
    manual_url: "https://www.linkedin.com/jobs/view/4",
    applied_at: null,
  },
  {
    id: "app_5",
    job_id: "job_3",
    status: "needs_manual",
    cv_pdf_path: "cvs/ramp.pdf",
    cover_letter: "Tailored cover letter…",
    tailor_cost_usd: 0.1,
    manual_reason: "CAPTCHA challenge on application form",
    manual_url: null,
    applied_at: null,
  },
  {
    id: "app_6",
    job_id: "job_6",
    status: "needs_manual",
    cv_pdf_path: "cvs/qatarenergy.pdf",
    cover_letter: "Tailored cover letter…",
    tailor_cost_usd: 0.08,
    manual_reason: "Email verification required before submission",
    manual_url: "https://careers.qatarenergy.qa/6",
    applied_at: null,
  },
  {
    id: "app_7",
    job_id: "job_1",
    status: "matched",
    cv_pdf_path: null,
    cover_letter: null,
    tailor_cost_usd: null,
    manual_reason: null,
    manual_url: null,
    applied_at: null,
  },
];

const MOCK_PROFILE: ProfileSummary = {
  contact: {
    name: "Dinc Cetintas",
    email: "dinccetintas24@gmail.com",
    phone: "+44 7700 900123",
    location: "London, UK",
    links: [
      { label: "GitHub", url: "https://github.com/dinc" },
      { label: "LinkedIn", url: "https://linkedin.com/in/dinc" },
    ],
  },
  workAuthorization: [
    { country: "UK", status: "Citizen — no sponsorship needed" },
    { country: "US", status: "Requires H-1B sponsorship" },
    { country: "NL", status: "EU work rights" },
    { country: "AE", status: "Eligible with relocation/visa support" },
  ],
  salaryExpectation: "£120k–£150k base (flexible on equity)",
  noticePeriod: "1 month",
  cvSections: {
    summary:
      "Machine learning engineer with 8+ years building LLM-powered products, RAG systems, and ML platforms at scale.",
    skills: [
      "Python",
      "PyTorch",
      "LLMs / RAG",
      "Distributed training",
      "Kubernetes",
      "TypeScript",
    ],
    experience: [
      {
        title: "Senior ML Engineer",
        company: "Acme AI",
        period: "2022 – Present",
        highlights: [
          "Led the RAG platform serving 2M+ daily queries.",
          "Cut inference cost 40% via quantization and caching.",
        ],
      },
      {
        title: "ML Engineer",
        company: "DataWorks",
        period: "2018 – 2022",
        highlights: [
          "Built the feature store powering 30+ production models.",
        ],
      },
    ],
    education: [
      { degree: "MSc Computer Science", school: "Imperial College London", period: "2016 – 2017" },
      { degree: "BSc Mathematics", school: "University of Edinburgh", period: "2012 – 2016" },
    ],
  },
};

// --- Helpers -------------------------------------------------------------

function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

// Lazily import the admin client only when env is present, so module load
// during build never throws.
async function client() {
  const { supabaseAdmin } = await import("./supabase");
  return supabaseAdmin();
}

export interface JobsFilter {
  country?: string;
  status?: ApplicationStatus;
  minScore?: number;
  sort?: "score" | "discovered_at";
}

export async function listJobs(filter?: JobsFilter): Promise<JobRowData[]> {
  if (!hasSupabaseEnv()) return filterJobsLocally(MOCK_JOBS, filter);
  try {
    const sb = await client();
    let query = sb.from("jobs").select("*");
    if (filter?.country) query = query.eq("country", filter.country);
    if (typeof filter?.minScore === "number") query = query.gte("score", filter.minScore);
    query = query.order(filter?.sort ?? "score", { ascending: false });
    const { data, error } = await query;
    if (error || !data) throw error ?? new Error("No data");
    return data as JobRowData[];
  } catch {
    return filterJobsLocally(MOCK_JOBS, filter);
  }
}

function filterJobsLocally(jobs: JobRowData[], filter?: JobsFilter): JobRowData[] {
  let out = [...jobs];
  if (filter?.country) out = out.filter((j) => j.country === filter.country);
  if (typeof filter?.minScore === "number")
    out = out.filter((j) => (j.score ?? 0) >= filter.minScore!);
  if (filter?.sort === "discovered_at") {
    out.sort((a, b) => b.discovered_at.localeCompare(a.discovered_at));
  } else {
    out.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }
  return out;
}

export async function listApplications(
  status?: ApplicationStatus,
): Promise<ApplicationRowData[]> {
  if (!hasSupabaseEnv())
    return status ? MOCK_APPLICATIONS.filter((a) => a.status === status) : MOCK_APPLICATIONS;
  try {
    const sb = await client();
    let query = sb.from("applications").select("*");
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error || !data) throw error ?? new Error("No data");
    return data as ApplicationRowData[];
  } catch {
    return status ? MOCK_APPLICATIONS.filter((a) => a.status === status) : MOCK_APPLICATIONS;
  }
}

export async function getFunnelCounts(): Promise<FunnelCounts> {
  const [jobs, apps] = await Promise.all([listJobs(), listApplications()]);
  const byStatus = (s: ApplicationStatus) => apps.filter((a) => a.status === s).length;
  // "matched" = jobs that have at least progressed past discovery.
  const matchedStatuses: ApplicationStatus[] = [
    "matched",
    "tailored",
    "applying",
    "applied",
    "needs_manual",
    "responded",
  ];
  const matched = apps.filter((a) => matchedStatuses.includes(a.status)).length;
  const tailored = apps.filter((a) =>
    ["tailored", "applying", "applied", "needs_manual", "responded"].includes(a.status),
  ).length;
  return {
    discovered: jobs.length,
    matched,
    tailored,
    applied: byStatus("applied") + byStatus("responded"),
    needsManual: byStatus("needs_manual"),
    responded: byStatus("responded"),
  };
}

export async function listManualQueue(): Promise<ManualQueueItem[]> {
  const [apps, jobs] = await Promise.all([
    listApplications("needs_manual"),
    listJobs(),
  ]);
  const jobsById = new Map(jobs.map((j) => [j.id, j]));
  return apps.map((application) => ({
    application,
    job: jobsById.get(application.job_id) ?? null,
  }));
}

export async function getProfileSummary(): Promise<ProfileSummary> {
  if (!hasSupabaseEnv()) return MOCK_PROFILE;
  try {
    const sb = await client();
    const { data, error } = await sb.from("profile").select("*").limit(1).single();
    if (error || !data) throw error ?? new Error("No data");
    // The DB stores cv_json + a few scalar columns; map defensively, falling
    // back to mock values for anything not present so the page always renders.
    const cv = (data.cv_json ?? {}) as Record<string, unknown>;
    return {
      contact: {
        ...MOCK_PROFILE.contact,
        ...(typeof cv.contact === "object" && cv.contact ? (cv.contact as object) : {}),
      },
      workAuthorization:
        (data.work_authorization as ProfileSummary["workAuthorization"]) ??
        MOCK_PROFILE.workAuthorization,
      salaryExpectation: (data.salary_expectation as string) ?? MOCK_PROFILE.salaryExpectation,
      noticePeriod: (data.notice_period as string) ?? MOCK_PROFILE.noticePeriod,
      cvSections: {
        ...MOCK_PROFILE.cvSections,
        ...(typeof cv.sections === "object" && cv.sections ? (cv.sections as object) : {}),
      },
    };
  } catch {
    return MOCK_PROFILE;
  }
}
