import { useSession } from "../session/SessionContext";

const STEPS = [
  { phase: 1, label: "Discovery" },
  { phase: 3, label: "Importance" },
  { phase: 4, label: "Mapping" },
  { phase: 5, label: "Redirect" },
  { phase: 6, label: "Report" },
];

const TOOL_LABELS = {
  adult_variant_a: "Adult Future Work Self — Variant A",
  adult_variant_b: "Adult Future Work Self — Variant B",
  youth: "Youth Career & Future Self Explorer",
  leadership: "Adult Leadership Identity Tool",
};

export default function PhaseShell({ children }) {
  const { session } = useSession();
  const currentIndex = STEPS.findIndex((step) => step.phase === session?.current_phase);

  return (
    <div className="phase-shell">
      <header className="phase-header">
        <div>
          <p className="eyebrow">{TOOL_LABELS[session?.tool_type] ?? "Identity Network Tool"}</p>
          <p className="sgic-badge">
            Your code: <strong>{session?.sgic}</strong> — save this to resume if your session drops
          </p>
        </div>
        <ol className="progress-steps">
          {STEPS.map((step, i) => (
            <li
              key={step.phase}
              className={
                i === currentIndex ? "step active" : i < currentIndex ? "step done" : "step"
              }
            >
              {step.label}
            </li>
          ))}
        </ol>
      </header>
      <main className="phase-main">{children}</main>
    </div>
  );
}
