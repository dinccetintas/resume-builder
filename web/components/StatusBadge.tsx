import type { ApplicationStatus } from "@/lib/types";

// Color mapping per ApplicationStatus. Each pairing keeps text contrast at or
// above WCAG AA (4.5:1) against its tinted background.
const STYLES: Record<ApplicationStatus, { label: string; className: string }> = {
  matched: { label: "Matched", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  tailored: { label: "Tailored", className: "bg-indigo-50 text-indigo-800 ring-indigo-200" },
  applying: { label: "Applying", className: "bg-amber-50 text-amber-800 ring-amber-200" },
  applied: { label: "Applied", className: "bg-blue-50 text-blue-800 ring-blue-200" },
  needs_manual: {
    label: "Needs manual",
    className: "bg-orange-50 text-orange-800 ring-orange-200",
  },
  skipped: { label: "Skipped", className: "bg-gray-100 text-gray-600 ring-gray-200" },
  responded: { label: "Responded", className: "bg-green-50 text-green-800 ring-green-200" },
  failed: { label: "Failed", className: "bg-red-50 text-red-800 ring-red-200" },
};

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { label, className } = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
