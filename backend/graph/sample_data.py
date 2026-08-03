"""Sample 'Future Work Self' item catalog + pairwise synergy/tension ratings.

Standing in for a real participant session: a set of career-identity items
(skills, values, traits) a participant would keep after Phase 2 refinement,
with Phase 4 pairwise synergy/tension weights from the hub-and-spoke mapping.
"""

ITEMS = [
    {"key": "creative-problem-solving", "label": "Creative Problem Solving", "category": "skill"},
    {"key": "technical-mastery", "label": "Technical Mastery", "category": "skill"},
    {"key": "team-leadership", "label": "Team Leadership", "category": "skill"},
    {"key": "continuous-learning", "label": "Continuous Learning", "category": "trait"},
    {"key": "autonomy", "label": "Autonomy & Independence", "category": "value"},
    {"key": "structured-environment", "label": "Structured Environment", "category": "value"},
    {"key": "financial-stability", "label": "Financial Stability", "category": "value"},
    {"key": "entrepreneurial-drive", "label": "Entrepreneurial Drive", "category": "trait"},
    {"key": "work-life-balance", "label": "Work-Life Balance", "category": "value"},
    {"key": "public-recognition", "label": "Public Recognition", "category": "value"},
    {"key": "social-impact", "label": "Social Impact", "category": "value"},
    {"key": "collaboration", "label": "Collaboration", "category": "skill"},
    {"key": "risk-tolerance", "label": "Risk Tolerance", "category": "trait"},
    {"key": "innovation", "label": "Innovation", "category": "trait"},
    {"key": "job-security", "label": "Job Security", "category": "value"},
]

RELATIONS = [
    ("creative-problem-solving", "innovation", "synergy", 0.9),
    ("innovation", "continuous-learning", "synergy", 0.85),
    ("innovation", "risk-tolerance", "synergy", 0.7),
    ("entrepreneurial-drive", "risk-tolerance", "synergy", 0.8),
    ("entrepreneurial-drive", "autonomy", "synergy", 0.75),
    ("entrepreneurial-drive", "financial-stability", "tension", 0.7),
    ("entrepreneurial-drive", "job-security", "tension", 0.8),
    ("autonomy", "structured-environment", "tension", 0.85),
    ("autonomy", "team-leadership", "synergy", 0.5),
    ("structured-environment", "job-security", "synergy", 0.6),
    ("structured-environment", "financial-stability", "synergy", 0.55),
    ("financial-stability", "job-security", "synergy", 0.8),
    ("financial-stability", "social-impact", "tension", 0.4),
    ("public-recognition", "work-life-balance", "tension", 0.65),
    ("public-recognition", "team-leadership", "synergy", 0.6),
    ("team-leadership", "collaboration", "synergy", 0.85),
    ("collaboration", "social-impact", "synergy", 0.5),
    ("collaboration", "work-life-balance", "synergy", 0.4),
    ("work-life-balance", "job-security", "synergy", 0.5),
    ("technical-mastery", "continuous-learning", "synergy", 0.8),
    ("technical-mastery", "creative-problem-solving", "synergy", 0.65),
    ("technical-mastery", "collaboration", "tension", 0.3),
    ("social-impact", "risk-tolerance", "synergy", 0.35),
    ("public-recognition", "financial-stability", "synergy", 0.45),
]
