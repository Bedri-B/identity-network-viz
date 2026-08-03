import { useEffect, useRef, useState } from "react";
import { fetchCatalog, fetchLayoutFor } from "../api";
import GraphView from "../GraphView";
import { useSession } from "../session/SessionContext";

export default function Report() {
  const { session, patch } = useSession();
  const [layout, setLayout] = useState(null);
  const [labelByKey, setLabelByKey] = useState(null);
  const [error, setError] = useState(null);
  const completedRef = useRef(false);

  const selectedKeys = session?.state?.selected_items ?? [];
  const importance = session?.state?.importance ?? {};
  const relations = session?.state?.relations ?? [];

  useEffect(() => {
    fetchCatalog()
      .then((data) => {
        const byKey = Object.fromEntries(data.items.map((item) => [item.key, item]));
        setLabelByKey(Object.fromEntries(data.items.map((item) => [item.key, item.label])));
        const nodes = selectedKeys
          .map((key) => byKey[key])
          .filter(Boolean)
          .map((item) => ({ key: item.key, label: item.label, category: item.category }));
        return fetchLayoutFor(nodes, relations);
      })
      .then(setLayout)
      .catch((err) => setError(err));
    // Recomputing on every relations/selectedKeys identity change would refetch
    // needlessly since arrays are stable for the session's lifetime once on this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!completedRef.current && session?.status !== "completed") {
      completedRef.current = true;
      patch(null, { status: "completed" }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.sgic]);

  return (
    <section>
      <div className="report-toolbar no-print">
        <h2>Phase 5 — Visual Feedback Report</h2>
        <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>

      {error && <p className="status-line status-error">{String(error.message ?? error)}</p>}
      {!layout && !error && <p className="status-line">Computing layout…</p>}
      {layout && <GraphView data={layout} />}

      {labelByKey && (
        <div className="importance-summary">
          <span className="legend-title">Importance ratings</span>
          {selectedKeys.map((key) => (
            <div className="importance-row" key={key}>
              <span className="importance-label">{labelByKey[key]}</span>
              <div className="importance-bar">
                <div className="importance-fill" style={{ width: `${(importance[key] ?? 0) * 20}%` }} />
              </div>
              <span className="importance-value">{importance[key] ?? "—"}/5</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
