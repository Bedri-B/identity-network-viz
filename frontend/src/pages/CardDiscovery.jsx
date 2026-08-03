import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCatalog } from "../api";
import { useSession } from "../session/SessionContext";

const REQUIRED_COUNT = 8;

export default function CardDiscovery() {
  const { session, patch } = useSession();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [selected, setSelected] = useState(() => new Set(session?.state?.selected_items ?? []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCatalog()
      .then((data) => setItems(data.items))
      .catch((err) => setError(err));
  }, []);

  const byCategory = useMemo(() => {
    if (!items) return [];
    const groups = new Map();
    for (const item of items) {
      if (!groups.has(item.category)) groups.set(item.category, []);
      groups.get(item.category).push(item);
    }
    return [...groups.entries()];
  }, [items]);

  function toggle(key) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else if (next.size < REQUIRED_COUNT) {
        next.add(key);
      }
      return next;
    });
  }

  async function handleContinue() {
    setSaving(true);
    try {
      await patch({ selected_items: [...selected] }, { phase: 3 });
      navigate("/phase/3");
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2>Phase 1 — Card Discovery &amp; Refinement</h2>
      <p className="phase-copy">
        Browse the full item catalog and keep exactly {REQUIRED_COUNT} skills, values, and traits
        that feel most like your future self. (Production tools split discovery and prune/top-up
        revision into two steps — combined here for this proof.)
      </p>
      <p className="selection-count">
        {selected.size} / {REQUIRED_COUNT} selected
      </p>

      {error && <p className="status-line status-error">{String(error.message ?? error)}</p>}
      {!items && !error && <p className="status-line">Loading catalog…</p>}

      {byCategory.map(([category, categoryItems]) => (
        <div key={category} className="catalog-group">
          <span className="legend-title">{category}</span>
          <div className="catalog-grid">
            {categoryItems.map((item) => (
              <button
                type="button"
                key={item.key}
                className={selected.has(item.key) ? "item-card selected" : "item-card"}
                onClick={() => toggle(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        className="btn btn-primary"
        disabled={selected.size !== REQUIRED_COUNT || saving}
        onClick={handleContinue}
      >
        {saving ? "Saving…" : "Continue to Importance Rating"}
      </button>
    </section>
  );
}
