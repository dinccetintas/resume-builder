import Link from "next/link";
import Nav from "@/components/Nav";
import StatCard from "@/components/StatCard";
import FunnelBar from "@/components/FunnelBar";
import StatusBadge from "@/components/StatusBadge";
import {
  getFunnelCounts,
  listJobs,
  listApplications,
  listManualQueue,
} from "@/lib/ui-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [funnel, jobs, apps, manual] = await Promise.all([
    getFunnelCounts(),
    listJobs({ sort: "score" }),
    listApplications(),
    listManualQueue(),
  ]);

  const statusByJob = new Map(apps.map((a) => [a.job_id, a.status]));
  const topRoles = jobs.slice(0, 5);

  const funnelStages = [
    { label: "Discovered", value: funnel.discovered, tone: "default" as const },
    { label: "Matched", value: funnel.matched, tone: "default" as const },
    { label: "Tailored", value: funnel.tailored, tone: "accent" as const },
    { label: "Applied", value: funnel.applied, tone: "success" as const },
    { label: "Needs manual", value: funnel.needsManual, tone: "warn" as const },
    { label: "Responded", value: funnel.responded, tone: "success" as const },
  ];

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <h1 className="font-serif text-3xl tracking-tight text-ink">Pipeline overview</h1>
          <p className="mt-1 text-muted">
            Automated discovery, ranking, and tailored applications for high-value AI/ML roles.
          </p>
        </header>

        {/* Key metrics */}
        <section aria-label="Pipeline metrics" className="mb-8">
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Roles discovered" value={funnel.discovered} hint="In the pipeline" />
            <StatCard label="Tailored" value={funnel.tailored} hint="CV + cover letter ready" emphasis />
            <StatCard label="Applied" value={funnel.applied} hint="Submitted automatically" />
            <StatCard
              label="Needs manual"
              value={funnel.needsManual}
              hint="Awaiting your action"
            />
          </dl>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Funnel */}
          <section
            aria-label="Pipeline funnel"
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2"
          >
            <h2 className="mb-5 font-serif text-xl text-ink">Funnel</h2>
            <FunnelBar stages={funnelStages} />
          </section>

          {/* Needs manual summary */}
          <section
            aria-label="Needs manual summary"
            className="flex flex-col rounded-xl border border-orange-200 bg-orange-50/50 p-6 shadow-sm"
          >
            <h2 className="font-serif text-xl text-ink">Needs manual</h2>
            <p className="mt-1 text-sm text-muted">
              {manual.length === 0
                ? "Nothing waiting — the queue is clear."
                : `${manual.length} application${manual.length === 1 ? "" : "s"} need a human to finish.`}
            </p>
            <ul className="mt-4 flex-1 space-y-2">
              {manual.slice(0, 3).map((item) => (
                <li key={item.application.id} className="text-sm">
                  <span className="font-medium text-ink">
                    {item.job?.company ?? "Unknown company"}
                  </span>
                  <span className="text-muted"> — {item.application.manual_reason}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/queue"
              className="mt-4 inline-flex items-center justify-center rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-navy/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Open the queue
            </Link>
          </section>
        </div>

        {/* Top high-value roles */}
        <section aria-label="Top high-value roles" className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl text-ink">Top high-value roles</h2>
            <Link
              href="/jobs"
              className="rounded-md text-sm font-medium text-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              View all jobs
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {topRoles.map((job) => {
              const status = statusByJob.get(job.id);
              return (
                <li
                  key={job.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{job.title}</p>
                    <p className="truncate text-sm text-muted">
                      {job.company}
                      {job.location ? ` · ${job.location}` : ""}
                    </p>
                    {status ? (
                      <span className="mt-2 inline-block">
                        <StatusBadge status={status} />
                      </span>
                    ) : null}
                  </div>
                  <span
                    className="shrink-0 font-serif text-2xl text-accent tabular-nums"
                    aria-label={`Score ${job.score ?? 0} of 100`}
                  >
                    {job.score ?? "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
