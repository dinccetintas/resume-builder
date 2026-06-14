// Company ATS adapters — Greenhouse / Lever / Ashby expose public job-board
// JSON APIs (free, legitimate). These are also where computer-use auto-apply
// works best. You curate a list of strong companies + their board tokens in
// config; discovery pulls open roles and includes the full JD for ranking.

import type { Job } from "../types";

export interface AtsTarget {
  ats: "greenhouse" | "lever" | "ashby";
  company: string; // display name
  token: string; // board token / org slug used in the API URL
}

// --- Greenhouse: https://boards-api.greenhouse.io/v1/boards/{token}/jobs ----
async function discoverGreenhouse(t: AtsTarget): Promise<Job[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${t.token}/jobs?content=true`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Greenhouse ${t.token} ${res.status}`);
  const data = (await res.json()) as {
    jobs?: Array<{ id: number; title: string; content?: string; absolute_url: string; location?: { name?: string } }>;
  };
  return (data.jobs ?? []).map((j) => ({
    source: "greenhouse",
    externalId: `${t.token}:${j.id}`,
    title: j.title,
    company: t.company,
    location: j.location?.name,
    jdText: decodeHtml(j.content ?? ""),
    applyUrl: j.absolute_url,
    ats: "greenhouse",
  }));
}

// --- Lever: https://api.lever.co/v0/postings/{token}?mode=json --------------
async function discoverLever(t: AtsTarget): Promise<Job[]> {
  const url = `https://api.lever.co/v0/postings/${t.token}?mode=json`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Lever ${t.token} ${res.status}`);
  const data = (await res.json()) as Array<{
    id: string;
    text: string;
    descriptionPlain?: string;
    hostedUrl: string;
    categories?: { location?: string };
  }>;
  return data.map((j) => ({
    source: "lever",
    externalId: `${t.token}:${j.id}`,
    title: j.text,
    company: t.company,
    location: j.categories?.location,
    jdText: j.descriptionPlain,
    applyUrl: j.hostedUrl,
    ats: "lever",
  }));
}

// --- Ashby: public posting API ---------------------------------------------
async function discoverAshby(t: AtsTarget): Promise<Job[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${t.token}?includeCompensation=true`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Ashby ${t.token} ${res.status}`);
  const data = (await res.json()) as {
    jobs?: Array<{ id: string; title: string; descriptionPlain?: string; jobUrl: string; location?: string }>;
  };
  return (data.jobs ?? []).map((j) => ({
    source: "ashby",
    externalId: `${t.token}:${j.id}`,
    title: j.title,
    company: t.company,
    location: j.location,
    jdText: j.descriptionPlain,
    applyUrl: j.jobUrl,
    ats: "ashby",
  }));
}

const ADAPTERS: Record<AtsTarget["ats"], (t: AtsTarget) => Promise<Job[]>> = {
  greenhouse: discoverGreenhouse,
  lever: discoverLever,
  ashby: discoverAshby,
};

/** Pull open roles from every configured ATS target; failures are isolated. */
export async function discoverAts(targets: AtsTarget[]): Promise<Job[]> {
  const out: Job[] = [];
  for (const t of targets) {
    try {
      out.push(...(await ADAPTERS[t.ats](t)));
    } catch (err) {
      // One bad board shouldn't kill the run; surface in run_logs upstream.
      console.error(`ATS discovery failed for ${t.ats}/${t.token}:`, err);
    }
  }
  return out;
}

// Greenhouse returns HTML-encoded content; strip tags + decode common entities.
function decodeHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
