import type { DecisionResult } from "@/types/weather";

const levelStyle = {
  proceed: {
    label: "Proceed",
    icon: "✅",
    className: "border-emerald-300/45 bg-emerald-300/15 text-emerald-200"
  },
  caution: {
    label: "Caution",
    icon: "⚠️",
    className: "border-amber-300/45 bg-amber-300/15 text-amber-200"
  },
  cancel: {
    label: "Cancel",
    icon: "⛔",
    className: "border-rose-300/45 bg-rose-300/15 text-rose-200"
  }
} as const;

export function DecisionBanner({ decision, summary }: { decision: DecisionResult; summary: string }) {
  const style = levelStyle[decision.level];

  return (
    <section className="space-y-3" aria-label="Decision summary">
      <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.09em] ${style.className}`}>
        <span>{style.icon}</span>
        <span>Recommend: {style.label}</span>
      </div>
      <p className="text-sm font-medium text-white/85">{summary}</p>
      <ul className="space-y-1 text-xs text-white/60">
        {decision.reasons.slice(0, 2).map((reason) => (
          <li key={reason}>Because: {reason}</li>
        ))}
      </ul>
    </section>
  );
}
