import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCatalog } from "../api";
import { useSession } from "../session/SessionContext";

export default function ImportanceRating() {
  const { session, patch } = useSession();
  const navigate = useNavigate();
  const [labelByKey, setLabelByKey] = useState(null);
  const [ratings, setRatings] = useState(() => ({ ...(session?.state?.importance ?? {}) }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const selectedKeys = session?.state?.selected_items ?? [];

  useEffect(() => {
    fetchCatalog()
      .then((data) => {
        setLabelByKey(Object.fromEntries(data.items.map((item) => [item.key, item.label])));
      })
      .catch((err) => setError(err));
  }, []);

  function setRating(key, value) {
    setRatings((prev) => ({ ...prev, [key]: Number(value) }));
  }

  async function handleContinue() {
    setSaving(true);
    try {
      await patch({ importance: ratings }, { phase: 4 });
      navigate("/phase/4");
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  const allRated = selectedKeys.every((key) => ratings[key] != null);

  return (
    <section>
      <h2>Phase 2 — Importance Rating</h2>
      <p className="phase-copy">
        Rate how important each of your {selectedKeys.length} chosen items is to your future work
        self, from 1 (nice to have) to 5 (essential).
      </p>

      {error && <p className="status-line status-error">{String(error.message ?? error)}</p>}
      {!labelByKey && !error && <p className="status-line">Loading…</p>}

      {labelByKey &&
        selectedKeys.map((key) => (
          <div className="slider-row" key={key}>
            <span className="slider-label">{labelByKey[key] ?? key}</span>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={ratings[key] ?? 3}
              onChange={(e) => setRating(key, e.target.value)}
            />
            <span className="slider-value">{ratings[key] ?? 3}</span>
          </div>
        ))}

      <button
        type="button"
        className="btn btn-primary"
        disabled={!allRated || saving}
        onClick={handleContinue}
      >
        {saving ? "Saving…" : "Continue to Pairwise Mapping"}
      </button>
    </section>
  );
}
