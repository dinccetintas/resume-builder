interface FunnelStage {
  label: string;
  value: number;
  tone?: "default" | "accent" | "warn" | "success";
}

const TONES: Record<NonNullable<FunnelStage["tone"]>, string> = {
  default: "bg-navy",
  accent: "bg-accent",
  warn: "bg-orange-500",
  success: "bg-green-600",
};

// Horizontal funnel: each stage bar is sized relative to the largest stage so
// the narrowing pipeline is visible at a glance. Width is driven by inline
// style (computed values, not class names) so Tailwind purging is irrelevant.
export default function FunnelBar({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <ol className="space-y-3" aria-label="Pipeline funnel">
      {stages.map((stage) => {
        const pct = Math.round((stage.value / max) * 100);
        return (
          <li key={stage.label} className="flex items-center gap-4">
            <span className="w-32 shrink-0 text-sm font-medium text-muted">
              {stage.label}
            </span>
            <div
              className="relative h-7 flex-1 overflow-hidden rounded-md bg-slate-100"
              role="img"
              aria-label={`${stage.label}: ${stage.value}`}
            >
              <div
                className={`flex h-full items-center justify-end rounded-md px-2 transition-[width] duration-300 ease-out ${
                  TONES[stage.tone ?? "default"]
                }`}
                style={{ width: `${Math.max(pct, 8)}%` }}
              >
                <span className="text-xs font-semibold text-white tabular-nums">
                  {stage.value}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
