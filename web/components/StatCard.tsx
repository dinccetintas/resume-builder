import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  emphasis?: boolean;
}

// A single metric tile for the dashboard's bento grid. Calm surface, soft
// border and a subtle hover lift per the ui-ux-pro-max guidance.
export default function StatCard({ label, value, hint, emphasis }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md ${
        emphasis ? "border-accent/30" : "border-slate-200"
      }`}
    >
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd
        className={`mt-2 font-serif text-3xl tracking-tight ${
          emphasis ? "text-accent" : "text-ink"
        }`}
      >
        {value}
      </dd>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
