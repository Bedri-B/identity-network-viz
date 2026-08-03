# Identity Network Viz

A working proof of the core system behind cognitive/identity network
research tools: URL-driven session bootstrap, a 5-phase participant journey
with real-time autosave and crash recovery, and a **Django REST Framework +
NetworkX** backend that computes a fixed-seed force-directed layout and
Louvain community clusters, rendered by **React** as hand-rolled SVG — no
D3, no client-side layout math — with multi-line label text wrapping and
iterative pairwise label collision avoidance.

Two things to try:
- **`/` (full journey)** — the actual participant flow: Card Discovery →
  Importance Rating → Pairwise Mapping → Qualtrics redirect stub → Visual
  Report. Session state autosaves at every step against a real Django
  backend, keyed by an 8-character SGIC.
- **`/sample`** — the original static Milestone-3 showcase: a denser 15-item
  seeded network, useful for eyeballing the layout/clustering pipeline in
  isolation.

## System architecture

**Session model** (`backend/participant_sessions/`): `Session.state` is a
JSON blob (`selected_items`, `importance`, `relations`) autosaved on every
phase transition via `PATCH /api/v1/sessions/<sgic>/save/`, so a dropped
connection resumes exactly where a participant left off.

**URL-driven bootstrap** (`GET /api/v1/sessions/init/`): mirrors the real
system's `?pid=&tool=` Qualtrics contract, plus classroom codes and bare
SGICs:
- `?sgic=X` — resume that exact session (typed-in crash recovery).
- `?pid=X&tool=Y` — reuse the participant's most recent in-progress session
  for that tool, or start one (stable identity across a dropped connection
  without remembering a code).
- neither — fresh session, fresh SGIC (classroom/walk-up participants).

`GET /api/v1/sessions/resume/?sgic=X` is the explicit crash-recovery lookup
the brief calls out separately from init.

**Item catalog + layout** (`backend/graph/`): 15 "Future Work Self" items
(skills/values/traits). `GET /api/v1/graph/catalog/` feeds Card Discovery;
`POST /api/v1/graph/layout/` takes a participant's chosen items + pairwise
ratings and returns the NetworkX/Louvain layout — same endpoint powers both
the sample showcase and the real per-session report.

**Wide CSV export**: a Django admin action on `Session` (`backend/participant_sessions/admin.py`)
exports 1 row per session — selected items, importance ratings, and every
pairwise relation as `kind`/`weight` column pairs — regenerated from the
live item catalog on every export, structured for SPSS/R.

## Deliberate simplifications (this is a bid proof, not the deliverable)

- **Phase 2 (Core Refinement)** is folded into Phase 1: participants pick
  exactly 8 items directly, rather than a separate over-select-then-prune
  step. The T2 revision wizard (Variant A) and redo-baseline flow (Variant B)
  aren't built — this proof demonstrates the session/phase/autosave
  backbone via one flow end-to-end, not all four.
- **Phase 5 (Qualtrics redirect)** is a stub screen, not a real redirect.
- **PDF report injection** isn't wired to real client HTML/CSS templates
  (none exist yet); the Report page does call `window.print()` per the
  brief's client-side-PDF approach, against its own styled markup.
- The Youth and Leadership tool variants exist as `Session.tool_type`
  choices in the schema but have no distinct frontend flow yet.

## Why layouts are deterministic

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
- `GET/POST /api/v1/graph/layout/` — sample-network / ad-hoc layout (Milestone 3).
- `GET /api/v1/graph/catalog/` — the item catalog.
- `GET /api/v1/sessions/init/` — URL-driven session bootstrap.
- `GET /api/v1/sessions/resume/` — crash-recovery lookup by SGIC.
- `PATCH /api/v1/sessions/<sgic>/save/` — autosave (state patch and/or phase advance).
- `/admin/` — Django admin for `Item` / `Relation` / `Session` (with wide CSV export).

Run tests: `python manage.py test` (30 tests)

## Frontend

```
cd frontend
npm install
cp .env.example .env   # point VITE_API_BASE at the backend if not localhost:8000
npm run dev
```

Run tests: `npm run test` (14 tests)

Pure, DOM-free logic lives outside components so it unit tests without a
browser: `src/graphMath.js` (label wrap + collision avoidance) and
`src/pairwise.js` (hub-and-spoke pair traversal).
