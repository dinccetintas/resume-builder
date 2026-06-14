import Nav from "@/components/Nav";
import { listManualQueue } from "@/lib/ui-data";

export const dynamic = "force-dynamic";

// Map a free-text manual_reason to a short, calm category chip.
function reasonTag(reason: string | null): string {
  if (!reason) return "Manual step";
  const r = reason.toLowerCase();
  if (r.includes("captcha")) return "CAPTCHA";
  if (r.includes("linkedin")) return "LinkedIn";
  if (r.includes("verif")) return "Verification";
  if (r.includes("login")) return "Login required";
  return "Manual step";
}

export default async function QueuePage() {
  const items = await listManualQueue();

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="font-serif text-3xl tracking-tight text-ink">Manual queue</h1>
          <p className="mt-1 text-muted">
            Applications the automation could not finish on its own. Open each link to complete it.
          </p>
        </header>

        {items.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="font-serif text-xl text-ink">All clear</p>
            <p className="mt-1 text-muted">No applications need manual attention right now.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map(({ application, job }) => {
              const url = application.manual_url ?? job?.apply_url ?? null;
              return (
                <li
                  key={application.id}
                  className="rounded-xl border border-orange-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-800 ring-1 ring-inset ring-orange-200">
                          {reasonTag(application.manual_reason)}
                        </span>
                        {job?.country ? (
                          <span className="text-xs text-muted">{job.country}</span>
                        ) : null}
                      </div>
                      <h2 className="mt-2 truncate font-medium text-ink">
                        {job?.title ?? "Unknown role"}
                      </h2>
                      <p className="truncate text-sm text-muted">
                        {job?.company ?? "Unknown company"}
                        {job?.location ? ` · ${job.location}` : ""}
                      </p>
                      <p className="mt-2 text-sm text-muted">
                        <span className="font-medium text-ink">Reason: </span>
                        {application.manual_reason ?? "Manual completion required."}
                      </p>
                    </div>

                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        Finish application
                        <span aria-hidden="true">&#8599;</span>
                      </a>
                    ) : (
                      <span className="shrink-0 text-sm text-muted">No link available</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
