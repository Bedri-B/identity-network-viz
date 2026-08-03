import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCatalog } from "../api";
import { hubSpokeSteps } from "../pairwise";
import { useSession } from "../session/SessionContext";

const NONE = "none";
const SYNERGY = "synergy";
const TENSION = "tension";

function pairKey(a, b) {
  return [a, b].sort().join("|");
}

export default function PairwiseMapping() {
  const { session, patch } = useSession();
  const navigate = useNavigate();
  const [labelByKey, setLabelByKey] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [hubIndex, setHubIndex] = useState(0);
  const [ratings, setRatings] = useState({}); // pairKey -> { kind, weight }

  const selectedKeys = session?.state?.selected_items ?? [];
  const steps = useMemo(() => hubSpokeSteps(selectedKeys), [selectedKeys]);
  const step = steps[hubIndex];

  useEffect(() => {
    fetchCatalog()
      .then((data) => {
        setLabelByKey(Object.fromEntries(data.items.map((item) => [item.key, item.label])));
      })
      .catch((err) => setError(err));
  }, []);

  function setRelation(spoke, kind, weight) {
    const key = pairKey(step.hub, spoke);
    setRatings((prev) => ({ ...prev, [key]: kind === NONE ? undefined : { kind, weight } }));
  }

  function relationFor(spoke) {
    return ratings[pairKey(step.hub, spoke)];
  }

  function buildRelations(finalRatings) {
    return Object.entries(finalRatings)
      .filter(([, value]) => value)
      .map(([key, value]) => {
        const [source, target] = key.split("|");
        return { source, target, kind: value.kind, weight: value.weight };
      });
  }

  async function handleNext() {
    setSaving(true);
    try {
      const relations = buildRelations(ratings);
      if (hubIndex < steps.length - 1) {
        await patch({ relations });
        setHubIndex((i) => i + 1);
      } else {
        await patch({ relations }, { phase: 5 });
        navigate("/phase/5");
      }
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  if (!labelByKey && !error) return <p className="status-line">Loading…</p>;
  if (error) return <p className="status-line status-error">{String(error.message ?? error)}</p>;
  if (!step) return <p className="status-line">Not enough items selected for pairwise mapping.</p>;

  return (
    <section>
      <h2>Phase 3 — Pairwise Synergy/Tension Mapping</h2>
      <p className="phase-copy">
        Hub {hubIndex + 1} of {steps.length}: how does <strong>{labelByKey[step.hub]}</strong> relate
        to each of the items below?
      </p>

      <div className="hub-panel">
        <div className="hub-node">{labelByKey[step.hub]}</div>
        {step.spokes.map((spoke) => {
          const relation = relationFor(spoke);
          const kind = relation?.kind ?? NONE;
          return (
            <div className="spoke-row" key={spoke}>
              <span className="spoke-label">{labelByKey[spoke]}</span>
              <div className="toggle-group">
                {[NONE, SYNERGY, TENSION].map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={kind === option ? `toggle toggle-${option} active` : `toggle toggle-${option}`}
                    onClick={() => setRelation(spoke, option, relation?.weight ?? 0.5)}
                  >
                    {option === NONE ? "No relation" : option}
                  </button>
                ))}
              </div>
              {kind !== NONE && (
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.1}
                  value={relation?.weight ?? 0.5}
                  onChange={(e) => setRelation(spoke, kind, Number(e.target.value))}
                />
              )}
            </div>
          );
        })}
      </div>

      <button type="button" className="btn btn-primary" disabled={saving} onClick={handleNext}>
        {saving ? "Saving…" : hubIndex < steps.length - 1 ? "Next hub" : "Continue to survey redirect"}
      </button>
    </section>
  );
}
