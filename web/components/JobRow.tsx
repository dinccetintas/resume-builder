import type { JobRowData } from "@/lib/ui-data";
import type { ApplicationStatus } from "@/lib/types";
import StatusBadge from "./StatusBadge";

// Color band for the score pill: high-value roles read as accent, mid as navy,
// lower as muted slate. Kept text contrast at or above WCAG AA.
function scoreTone(score: number | null): string {
  if (score == null) return "bg-slate-100 text-slate-600 ring-slate-200";
  if (score >= 90) return "bg-blue-50 text-blue-800 ring-blue-200";
  if (score >= 80) return "bg-sky-50 text-sky-800 ring-sky-200";
  if (score >= 70) return "bg-slate-100 text-slate-700 ring-slate-200";
  return "bg-slate-50 text-slate-500 ring-slate-200";
}

interface JobRowProps {
  job: JobRowData;
  status?: ApplicationStatus;
  /** Render as a table row (default) or a self-contained card for narrow views. */
  as?: "tr" | "card";
}

function ScorePill({ score }: { score: number | null }) {
  return (
    <span
      className={`inline-flex min-w-[2.75rem] justify-center rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums ring-1 ring-inset ${scoreTone(
        score,
      )}`}
      aria-label={score == null ? "Not scored" : `Score ${score} of 100`}
    >
      {score == null ? "—" : score}
    </span>
  );
}

export default function JobRow({ job, status, as = "tr" }: JobRowProps) {
  const meta = [job.location, job.source].filter(Boolean).join(" · ");

  if (as === "card") {
    return (
      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-medium text-ink">{job.title}</h3>
            <p className="truncate text-sm text-muted">{job.company}</p>
          </div>
          <ScorePill score={job.score} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          {meta ? <span>{meta}</span> : null}
          {status ? <StatusBadge status={status} /> : null}
        </div>
      </article>
    );
  }

  return (
    <tr className="border-t border-slate-100 transition-colors duration-150 hover:bg-surface">
      <td className="px-4 py-3">
        <div className="font-medium text-ink">{job.title}</div>
        <div className="text-sm text-muted">{job.company}</div>
      </td>
      <td className="px-4 py-3 text-sm text-muted">{job.country ?? "—"}</td>
      <td className="hidden px-4 py-3 text-sm text-muted sm:table-cell">
        {job.location ?? "—"}
      </td>
      <td className="px-4 py-3">
        <ScorePill score={job.score} />
      </td>
      <td className="px-4 py-3">
        {status ? <StatusBadge status={status} /> : <span className="text-sm text-muted">—</span>}
      </td>
      <td className="px-4 py-3 text-right">
        {job.apply_url ? (
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-accent underline-offset-2 transition-colors duration-150 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            View
            <span aria-hidden="true">&#8599;</span>
          </a>
        ) : (
          <span className="text-sm text-muted">—</span>
        )}
      </td>
    </tr>
  );
}
