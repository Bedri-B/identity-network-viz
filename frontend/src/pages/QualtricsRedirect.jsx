import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../session/SessionContext";

export default function QualtricsRedirect() {
  const { session, patch } = useSession();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleContinue() {
    setSaving(true);
    try {
      await patch(null, { phase: 6 });
      navigate("/phase/6");
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2>Phase 4 — Qualtrics Survey Redirect</h2>
      <p className="phase-copy">
        In production, {session?.sgic} would now redirect to a Qualtrics survey block (carrying{" "}
        <code>sgic</code> and <code>tool</code> as URL parameters) to collect standardized outcome
        measures before returning here for the visual report. This proof simulates that hop.
      </p>
      {error && <p className="status-line status-error">{String(error.message ?? error)}</p>}
      <button type="button" className="btn btn-primary" disabled={saving} onClick={handleContinue}>
        {saving ? "Saving…" : "Continue (simulate return from Qualtrics)"}
      </button>
    </section>
  );
}
