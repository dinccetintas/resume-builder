// Adzuna adapter — free job-search API with good UK / US / NL coverage.
// Sign up at https://developer.adzuna.com for app_id + app_key (free tier).
// Docs: https://developer.adzuna.com/docs/search

import type { Country, Job } from "../types";

const COUNTRY_ENDPOINTS: Record<string, Country> = {
  gb: "UK",
  us: "US",
  nl: "NL",
};

export interface AdzunaQuery {
  what: string; // e.g. "senior ai engineer"
  countries?: Array<keyof typeof COUNTRY_ENDPOINTS>; // default: gb, us, nl
  resultsPerCountry?: number; // default 50
  maxDaysOld?: number; // default 14
}

interface AdzunaResult {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  created: string;
  location?: { display_name?: string };
  company?: { display_name?: string };
}

const BASE = "https://api.adzuna.com/v1/api/jobs";

/** Fetch and normalize jobs from Adzuna across the configured countries. */
export async function discoverAdzuna(q: AdzunaQuery): Promise<Job[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    throw new Error("ADZUNA_APP_ID / ADZUNA_APP_KEY not set");
  }

  const countries = q.countries ?? (["gb", "us", "nl"] as const);
  const perPage = q.resultsPerCountry ?? 50;
  const maxDaysOld = q.maxDaysOld ?? 14;

  const jobs: Job[] = [];
  for (const cc of countries) {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: String(perPage),
      what: q.what,
      max_days_old: String(maxDaysOld),
      content_type: "application/json",
    });
    const url = `${BASE}/${cc}/search/1?${params.toString()}`;
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`Adzuna ${cc} ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as { results?: AdzunaResult[] };
    for (const r of data.results ?? []) {
      jobs.push({
        source: "adzuna",
        externalId: `${cc}:${r.id}`,
        title: r.title,
        company: r.company?.display_name ?? "Unknown",
        location: r.location?.display_name,
        country: COUNTRY_ENDPOINTS[cc],
        jdText: r.description,
        applyUrl: r.redirect_url,
        postedAt: r.created,
      });
    }
  }
  return jobs;
}
