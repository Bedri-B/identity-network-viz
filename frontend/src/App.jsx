import { useEffect, useState } from "react";
import { fetchSampleLayout } from "./api";
import GraphView from "./GraphView";

export default function App() {
  const [state, setState] = useState({ status: "loading", data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    fetchSampleLayout()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: "error", data: null, error });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Milestone 3 proof of concept</p>
        <h1>Cognitive Identity Network — Layout Engine</h1>
        <p className="subtitle">
          Django REST Framework + NetworkX compute a fixed-seed force-directed layout and Louvain
          community clusters server-side; React renders it as hand-rolled SVG with wrapped,
          collision-avoided labels — no client-side layout math, no D3.
        </p>
      </header>

      <main>
        {state.status === "loading" && <p className="status-line">Requesting layout from Django…</p>}
        {state.status === "error" && (
          <p className="status-line status-error">
            Couldn&apos;t reach the backend at the configured API base. Is <code>manage.py runserver</code> running?
          </p>
        )}
        {state.status === "ready" && <GraphView data={state.data} />}
      </main>

      <footer className="app-footer">
        Sample dataset: 15 items / 24 pairwise synergy &amp; tension ratings from a mock Future-Work-Self
        session. Seed {state.data?.seed ?? "—"} — identical on every reload.
      </footer>
    </div>
  );
}
