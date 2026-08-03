# Identity Network Viz

A small, working proof of the graph-layout pipeline behind cognitive/identity
network visualization tools: **Django REST Framework + NetworkX** compute a
fixed-seed force-directed layout and Louvain community clusters server-side;
a **React** frontend renders it as hand-rolled SVG — no D3, no client-side
layout math — with multi-line label text wrapping and iterative pairwise
label collision avoidance.

Sample dataset: 15 "Future Work Self" identity items (skills, values, traits)
and 24 pairwise synergy/tension ratings, standing in for what a participant's
Phase 4 hub-and-spoke mapping session would produce.

## Why it's deterministic

Every layout call is seeded (`LAYOUT_SEED = 42` in `backend/graph/layout.py`),
so re-rendering the same participant's report — or a QA diff between two
runs — produces identical coordinates and community colors every time.

## Backend

```
cd backend
python -m venv .venv
.venv/Scripts/activate        # .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_sample_network
python manage.py runserver
```

Postgres is used automatically when `POSTGRES_DB` is set in the environment;
otherwise it falls back to SQLite for local dev.

Endpoints:
- `GET /api/v1/graph/layout/` — layout for the seeded sample network.
- `POST /api/v1/graph/layout/` — layout for an ad-hoc `{nodes, edges}` payload
  (e.g. a real participant's item catalog + pairwise ratings), not persisted.
- `/admin/` — Django admin for `Item` / `Relation`.

Run tests: `python manage.py test graph`

## Frontend

```
cd frontend
npm install
cp .env.example .env   # point VITE_API_BASE at the backend if not localhost:8000
npm run dev
```

Run tests: `npm run test`

The layout/collision-avoidance math lives in `src/graphMath.js`, kept pure
and DOM-free so it unit tests without a browser.
