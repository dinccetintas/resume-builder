import Nav from "@/components/Nav";
import JobsTable from "./JobsTable";
import { listJobs, listApplications } from "@/lib/ui-data";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const [jobs, apps] = await Promise.all([listJobs(), listApplications()]);
  const statusByJob = Object.fromEntries(apps.map((a) => [a.job_id, a.status]));

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="font-serif text-3xl tracking-tight text-ink">Jobs</h1>
          <p className="mt-1 text-muted">
            Every discovered role. Filter by country or status and sort by score.
          </p>
        </header>
        <JobsTable jobs={jobs} statusByJob={statusByJob} />
      </main>
    </div>
  );
}
