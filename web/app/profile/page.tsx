import Nav from "@/components/Nav";
import { getProfileSummary } from "@/lib/ui-data";

export const dynamic = "force-dynamic";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="mb-4 font-serif text-xl text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  );
}

export default async function ProfilePage() {
  const profile = await getProfileSummary();
  const { contact, workAuthorization, salaryExpectation, noticePeriod, cvSections } = profile;

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="font-serif text-3xl tracking-tight text-ink">Profile</h1>
          <p className="mt-1 text-muted">
            The &ldquo;fill once&rdquo; data reused to tailor and submit every application.
          </p>
        </header>

        <div className="space-y-6">
          {/* Contact */}
          <Card title="Contact">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name" value={contact.name} />
              <Field
                label="Email"
                value={
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-accent underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {contact.email}
                  </a>
                }
              />
              <Field label="Phone" value={contact.phone} />
              <Field label="Location" value={contact.location} />
            </dl>
            {contact.links.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {contact.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1 text-sm font-medium text-navy transition-colors duration-150 hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {link.label}
                      <span aria-hidden="true">&#8599;</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>

          {/* Screening answers */}
          <Card title="Screening answers">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Salary expectation" value={salaryExpectation} />
              <Field label="Notice period" value={noticePeriod} />
            </dl>
            <h3 className="mt-6 mb-2 text-sm font-semibold text-ink">
              Work authorization by country
            </h3>
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {workAuthorization.map((wa) => (
                <li
                  key={wa.country}
                  className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm"
                >
                  <span className="font-medium text-ink">{wa.country}</span>
                  <span className="text-right text-muted">{wa.status}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Base CV */}
          <Card title="Base CV">
            <Field label="Summary" value={cvSections.summary} />

            <h3 className="mb-2 mt-6 text-sm font-semibold text-ink">Skills</h3>
            <ul className="flex flex-wrap gap-2">
              {cvSections.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full bg-surface px-3 py-1 text-sm text-ink ring-1 ring-inset ring-slate-200"
                >
                  {skill}
                </li>
              ))}
            </ul>

            <h3 className="mb-3 mt-6 text-sm font-semibold text-ink">Experience</h3>
            <ol className="space-y-4">
              {cvSections.experience.map((exp, i) => (
                <li key={`${exp.company}-${i}`} className="border-l-2 border-slate-200 pl-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium text-ink">
                      {exp.title} &middot; {exp.company}
                    </p>
                    <p className="text-xs text-muted">{exp.period}</p>
                  </div>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted">
                    {exp.highlights.map((h, j) => (
                      <li key={j}>{h}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>

            <h3 className="mb-3 mt-6 text-sm font-semibold text-ink">Education</h3>
            <ul className="space-y-2">
              {cvSections.education.map((ed, i) => (
                <li key={`${ed.school}-${i}`} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="text-ink">
                    {ed.degree} &middot; {ed.school}
                  </span>
                  <span className="text-xs text-muted">{ed.period}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}
