// High-value ranking: prioritize career-boosting roles, not just any match.
//
// The user's explicit goal is roles that boost their career. We score each job
// on three axes and combine them, then a floor in config drops low-value roles
// so tailoring + apply effort (and API spend) goes to the best opportunities.
//
//   seniority  — title signals (senior/staff/lead/principal/manager/head)
//   prestige   — company tier (configurable list of strong employers) + signals
//   fit        — overlap between the JD and the candidate's skill profile

import type { Job, ScoreBreakdown } from "./types";

const SENIORITY_TIERS: Array<{ terms: string[]; weight: number }> = [
  { terms: ["principal", "staff", "head of", "director", "vp", "distinguished"], weight: 1.0 },
  { terms: ["lead", "senior", "sr.", "sr ", "manager", "architect"], weight: 0.8 },
  { terms: ["mid", "ii", "iii"], weight: 0.5 },
  { terms: ["junior", "jr", "intern", "graduate", "entry"], weight: 0.1 },
];

// Skills that matter for this candidate (AI/ML platform engineer). Tunable via config.
const FIT_KEYWORDS = [
  "llm",
  "rag",
  "generative ai",
  "genai",
  "agent",
  "agentic",
  "machine learning",
  "ml",
  "mlops",
  "llmops",
  "fastapi",
  "python",
  "kubernetes",
  "docker",
  "aws",
  "azure",
  "vector",
  "embedding",
  "fine-tun",
  "inference",
  "pytorch",
  "model serving",
  "retrieval",
];

export interface RankConfig {
  // Strong employers worth prioritizing. Lowercased substring match on company.
  prestigeCompanies: string[];
  // Score floor (0..100) below which a job is skipped.
  floor: number;
}

export const DEFAULT_RANK_CONFIG: RankConfig = {
  prestigeCompanies: [
    "openai",
    "anthropic",
    "google",
    "deepmind",
    "meta",
    "microsoft",
    "nvidia",
    "amazon",
    "apple",
    "stripe",
    "databricks",
    "cohere",
    "mistral",
    "hugging face",
    "scale ai",
    "palantir",
    "bloomberg",
    "jpmorgan",
    "goldman",
    "revolut",
    "booking",
    "adyen",
    "datadog",
  ],
  floor: 45,
};

function seniorityScore(title: string): { score: number; reason: string } {
  const t = title.toLowerCase();
  for (const tier of SENIORITY_TIERS) {
    if (tier.terms.some((term) => t.includes(term))) {
      return { score: tier.weight, reason: `seniority signal in "${title}"` };
    }
  }
  return { score: 0.55, reason: "no explicit seniority signal (treated as mid)" };
}

function prestigeScore(company: string, cfg: RankConfig): { score: number; reason: string } {
  const c = company.toLowerCase();
  if (cfg.prestigeCompanies.some((p) => c.includes(p))) {
    return { score: 1.0, reason: `recognized high-prestige employer (${company})` };
  }
  return { score: 0.5, reason: "employer not in prestige list (neutral)" };
}

function fitScore(job: Job): { score: number; reason: string } {
  const hay = `${job.title} ${job.jdText ?? ""}`.toLowerCase();
  const hits = FIT_KEYWORDS.filter((k) => hay.includes(k));
  // Saturating: ~8 keyword hits = full fit.
  const score = Math.min(1, hits.length / 8);
  return { score, reason: `${hits.length} skill matches: ${hits.slice(0, 6).join(", ")}` };
}

export function rankJob(job: Job, cfg: RankConfig = DEFAULT_RANK_CONFIG): ScoreBreakdown {
  const s = seniorityScore(job.title);
  const p = prestigeScore(job.company, cfg);
  const f = fitScore(job);
  // Weighted: fit is necessary; seniority + prestige make it career-boosting.
  const total = Math.round((0.45 * f.score + 0.3 * s.score + 0.25 * p.score) * 100);
  return {
    seniority: s.score,
    prestige: p.score,
    fit: f.score,
    total,
    reasons: [f.reason, s.reason, p.reason],
  };
}

/** True when the job clears the configured value floor (worth pursuing). */
export function isHighValue(score: ScoreBreakdown, cfg: RankConfig = DEFAULT_RANK_CONFIG): boolean {
  return score.total >= cfg.floor;
}
