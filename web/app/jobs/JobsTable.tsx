"use client";

import { useMemo, useState } from "react";
import type { JobRowData } from "@/lib/ui-data";
import type { ApplicationStatus } from "@/lib/types";
import JobRow from "@/components/JobRow";

type SortKey = "score" | "discovered_at";

interface JobsTableProps {
  jobs: JobRowData[];
  statusByJob: Record<string, ApplicationStatus>;
}

const STATUS_OPTIONS: { value: ApplicationStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "matched", label: "Matched" },
  { value: "tailored", label: "Tailored" },
  { value: "applying", label: "Applying" },
  { value: "applied", label: "Applied" },
  { value: "needs_manual", label: "Needs manual" },
  { value: "responded", label: "Responded" },
  { value: "skipped", label: "Skipped" },
  { value: "failed", label: "Failed" },
];

const selectClass =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-ink shadow-sm transition-colors duration-150 focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default function JobsTable({ jobs, statusByJob }: JobsTableProps) {
  const [country, setCountry] = useState<string>("all");
  const [status, setStatus] = useState<ApplicationStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("score");

  const countries = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.country).filter(Boolean))) as string[],
    [jobs],
  );

  const rows = useMemo(() => {
    let out = jobs.filter((j) => {
      if (country !== "all" && j.country !== country) return false;
      if (status !== "all" && statusByJob[j.id] !== status) return false;
      return true;
    });
    out = [...out].sort((a, b) =>
      sort === "score"
        ? (b.score ?? 0) - (a.score ?? 0)
        : (b.discovered_at ?? "").localeCompare(a.discovered_at ?? ""),
    );
    return out;
  }, [jobs, statusByJob, country, status, sort]);

  return (
    <section>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-country" className="text-xs font-medium text-muted">
            Country
          </label>
          <select
            id="filter-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={selectClass}
          >
            <option value="all">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-status" className="text-xs font-medium text-muted">
            Status
          </label>
          <select
            id="filter-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ApplicationStatus | "all")}
            className={selectClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-sort" className="text-xs font-medium text-muted">
            Sort by
          </label>
          <select
            id="filter-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={selectClass}
          >
            <option value="score">Score (high to low)</option>
            <option value="discovered_at">Most recently discovered</option>
          </select>
        </div>

        <p className="ml-auto self-center text-sm text-muted" aria-live="polite">
          {rows.length} {rows.length === 1 ? "role" : "roles"}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Discovered jobs with score and application status</caption>
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-4 py-3 font-medium">Role</th>
              <th scope="col" className="px-4 py-3 font-medium">Country</th>
              <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">Location</th>
              <th scope="col" className="px-4 py-3 font-medium">Score</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Apply</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                  No roles match these filters.
                </td>
              </tr>
            ) : (
              rows.map((job) => (
                <JobRow key={job.id} job={job} status={statusByJob[job.id]} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
