// Route-level loading skeleton. Calm pulse placeholders that mirror the
// dashboard's metric grid + content blocks. Respects prefers-reduced-motion
// via Tailwind's motion-safe variant.
function Block({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-slate-200/70 motion-safe:animate-pulse ${className}`} />
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Block className="h-7 w-28" />
          <Block className="h-7 w-64" />
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-busy="true" aria-label="Loading">
        <Block className="mb-2 h-9 w-64" />
        <Block className="mb-8 h-5 w-96 max-w-full" />

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Block key={i} className="h-28" />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Block className="h-64 lg:col-span-2" />
          <Block className="h-64" />
        </div>

        <span className="sr-only">Loading content</span>
      </main>
    </div>
  );
}
