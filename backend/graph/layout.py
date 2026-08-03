"""Force-directed layout + Louvain community clustering for identity networks.

Given a set of items and pairwise synergy/tension relations, this module
computes fixed-seed (x, y) node coordinates with NetworkX's spring layout and
assigns each node to a Louvain community for color clustering. Coordinates
are normalized into a fixed canvas so the frontend can render them directly
without doing any layout math of its own.

Determinism matters here: participants re-viewing their own report, or QA
comparing two runs, must see the same graph shape every time for the same
input. `LAYOUT_SEED` pins both the spring layout and the Louvain resolution
step.
"""

import networkx as nx

LAYOUT_SEED = 42
CANVAS_WIDTH = 900
CANVAS_HEIGHT = 640
CANVAS_PADDING = 70

# Categorical palette for community color clustering, chosen for light/dark
# background legibility and colorblind-safe hue spacing (Okabe-Ito derived).
COMMUNITY_PALETTE = [
    "#4C6EF5",  # blue
    "#F76707",  # orange
    "#12B886",  # teal
    "#E64980",  # pink
    "#FAB005",  # amber
    "#7048E8",  # violet
    "#15AABF",  # cyan
]


def build_graph(items, relations):
    """items: iterable of {key, label, category}. relations: iterable of
    {source, target, kind, weight} where source/target are item keys."""
    graph = nx.Graph()
    for item in items:
        graph.add_node(item["key"], label=item["label"], category=item["category"])
    for rel in relations:
        # Tensions still pull nodes together during layout (they're a strong
        # pairwise relationship) but should visually repel less than synergies,
        # so we keep layout weight based on rated strength regardless of kind.
        graph.add_edge(rel["source"], rel["target"], kind=rel["kind"], weight=rel["weight"])
    return graph


def _normalize_positions(pos):
    xs = [p[0] for p in pos.values()]
    ys = [p[1] for p in pos.values()]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    span_x = (max_x - min_x) or 1.0
    span_y = (max_y - min_y) or 1.0

    usable_w = CANVAS_WIDTH - 2 * CANVAS_PADDING
    usable_h = CANVAS_HEIGHT - 2 * CANVAS_PADDING

    normalized = {}
    for node, (x, y) in pos.items():
        nx_ = CANVAS_PADDING + (x - min_x) / span_x * usable_w
        ny_ = CANVAS_PADDING + (y - min_y) / span_y * usable_h
        normalized[node] = (round(nx_, 2), round(ny_, 2))
    return normalized


def compute_layout(graph, seed=LAYOUT_SEED):
    """Fixed-seed force-directed (x, y) per node, normalized to the canvas."""
    pos = nx.spring_layout(graph, seed=seed, weight="weight", k=None)
    return _normalize_positions(pos)


def detect_communities(graph, seed=LAYOUT_SEED):
    """Louvain community detection -> {node_key: community_index}."""
    if graph.number_of_edges() == 0:
        return {node: 0 for node in graph.nodes}
    communities = nx.algorithms.community.louvain_communities(graph, weight="weight", seed=seed)
    assignment = {}
    for idx, community in enumerate(communities):
        for node in community:
            assignment[node] = idx
    return assignment


def build_layout_response(items, relations):
    graph = build_graph(items, relations)
    positions = compute_layout(graph)
    communities = detect_communities(graph)
    degrees = dict(graph.degree())

    nodes = []
    for key, data in graph.nodes(data=True):
        x, y = positions[key]
        community = communities[key]
        nodes.append({
            "id": key,
            "label": data["label"],
            "category": data["category"],
            "x": x,
            "y": y,
            "community": community,
            "color": COMMUNITY_PALETTE[community % len(COMMUNITY_PALETTE)],
            "degree": degrees[key],
        })

    edges = [
        {
            "source": u,
            "target": v,
            "kind": data["kind"],
            "weight": data["weight"],
        }
        for u, v, data in graph.edges(data=True)
    ]

    return {
        "canvas": {"width": CANVAS_WIDTH, "height": CANVAS_HEIGHT},
        "seed": LAYOUT_SEED,
        "nodes": nodes,
        "edges": edges,
    }
