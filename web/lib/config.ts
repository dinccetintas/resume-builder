// Pipeline configuration: what to search for, where, and which ATS boards to
// pull. Tune these to steer the system toward your target roles/markets.

import type { AtsTarget } from "./discover/ats";
import { DEFAULT_RANK_CONFIG, type RankConfig } from "./rank";

export interface PipelineConfig {
  searchTerms: string[]; // queries sent to Adzuna
  adzunaCountries: Array<"gb" | "us" | "nl">;
  atsTargets: AtsTarget[]; // curated high-value company boards
  rank: RankConfig;
}

export const PIPELINE_CONFIG: PipelineConfig = {
  searchTerms: [
    "senior ai engineer",
    "machine learning engineer",
    "llm engineer",
    "ai platform engineer",
    "mlops engineer",
  ],
  adzunaCountries: ["gb", "us", "nl"],
  // Seed list — extend with the companies you most want to work for. The
  // `token` is the board slug in each ATS's public URL.
  atsTargets: [
    { ats: "greenhouse", company: "Anthropic", token: "anthropic" },
    { ats: "greenhouse", company: "Databricks", token: "databricks" },
    { ats: "lever", company: "Mistral AI", token: "mistral" },
    { ats: "ashby", company: "Cohere", token: "cohere" },
  ],
  rank: DEFAULT_RANK_CONFIG,
};
