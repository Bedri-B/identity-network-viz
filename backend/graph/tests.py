from django.test import TestCase
from rest_framework.test import APIClient

from .layout import (
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    build_graph,
    build_layout_response,
    compute_layout,
    detect_communities,
)
from .models import Item, Relation

SAMPLE_ITEMS = [
    {"key": "a", "label": "A", "category": "skill"},
    {"key": "b", "label": "B", "category": "skill"},
    {"key": "c", "label": "C", "category": "value"},
    {"key": "d", "label": "D", "category": "value"},
]

SAMPLE_RELATIONS = [
    {"source": "a", "target": "b", "kind": "synergy", "weight": 0.9},
    {"source": "c", "target": "d", "kind": "synergy", "weight": 0.8},
    {"source": "b", "target": "c", "kind": "tension", "weight": 0.3},
]


class BuildGraphTests(TestCase):
    def test_nodes_and_edges_carry_attributes(self):
        graph = build_graph(SAMPLE_ITEMS, SAMPLE_RELATIONS)
        self.assertEqual(set(graph.nodes), {"a", "b", "c", "d"})
        self.assertEqual(graph.number_of_edges(), 3)
        self.assertEqual(graph["a"]["b"]["kind"], "synergy")
        self.assertEqual(graph.nodes["a"]["label"], "A")


class ComputeLayoutTests(TestCase):
    def test_deterministic_for_fixed_seed(self):
        graph = build_graph(SAMPLE_ITEMS, SAMPLE_RELATIONS)
        first = compute_layout(graph, seed=42)
        second = compute_layout(graph, seed=42)
        self.assertEqual(first, second)

    def test_positions_stay_within_canvas(self):
        graph = build_graph(SAMPLE_ITEMS, SAMPLE_RELATIONS)
        positions = compute_layout(graph)
        for x, y in positions.values():
            self.assertGreaterEqual(x, 0)
            self.assertLessEqual(x, CANVAS_WIDTH)
            self.assertGreaterEqual(y, 0)
            self.assertLessEqual(y, CANVAS_HEIGHT)

    def test_different_seed_can_change_layout(self):
        # Not guaranteed to differ for every graph, but for this asymmetric
        # one it does -- guards against compute_layout silently ignoring seed.
        graph = build_graph(SAMPLE_ITEMS, SAMPLE_RELATIONS)
        a = compute_layout(graph, seed=1)
        b = compute_layout(graph, seed=2)
        self.assertNotEqual(a, b)


class DetectCommunitiesTests(TestCase):
    def test_every_node_assigned(self):
        graph = build_graph(SAMPLE_ITEMS, SAMPLE_RELATIONS)
        communities = detect_communities(graph)
        self.assertEqual(set(communities.keys()), {"a", "b", "c", "d"})

    def test_deterministic_for_fixed_seed(self):
        graph = build_graph(SAMPLE_ITEMS, SAMPLE_RELATIONS)
        first = detect_communities(graph, seed=42)
        second = detect_communities(graph, seed=42)
        self.assertEqual(first, second)

    def test_isolated_node_gets_its_own_community_id(self):
        graph = build_graph(SAMPLE_ITEMS, [])
        communities = detect_communities(graph)
        self.assertEqual(len(set(communities.values())), 1)  # no edges -> single fallback bucket


class BuildLayoutResponseTests(TestCase):
    def test_response_shape(self):
        response = build_layout_response(SAMPLE_ITEMS, SAMPLE_RELATIONS)
        self.assertEqual(response["seed"], 42)
        self.assertEqual(len(response["nodes"]), 4)
        self.assertEqual(len(response["edges"]), 3)
        node = response["nodes"][0]
        for field in ("id", "label", "category", "x", "y", "community", "color", "degree"):
            self.assertIn(field, node)

    def test_same_community_nodes_share_color(self):
        response = build_layout_response(SAMPLE_ITEMS, SAMPLE_RELATIONS)
        by_community = {}
        for node in response["nodes"]:
            by_community.setdefault(node["community"], set()).add(node["color"])
        for colors in by_community.values():
            self.assertEqual(len(colors), 1)


class GraphLayoutViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        items = {item["key"]: Item.objects.create(**item) for item in SAMPLE_ITEMS}
        for rel in SAMPLE_RELATIONS:
            Relation.objects.create(
                source=items[rel["source"]],
                target=items[rel["target"]],
                kind=rel["kind"],
                weight=rel["weight"],
            )

    def test_get_returns_seeded_network(self):
        response = self.client.get("/api/v1/graph/layout/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["nodes"]), 4)
        self.assertEqual(len(response.data["edges"]), 3)

    def test_post_accepts_ad_hoc_payload(self):
        payload = {
            "nodes": [
                {"key": "x", "label": "X", "category": "trait"},
                {"key": "y", "label": "Y", "category": "trait"},
            ],
            "edges": [
                {"source": "x", "target": "y", "kind": "synergy", "weight": 0.5},
            ],
        }
        response = self.client.post("/api/v1/graph/layout/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["nodes"]), 2)

    def test_post_rejects_edge_with_unknown_node(self):
        payload = {
            "nodes": [{"key": "x", "label": "X", "category": "trait"}],
            "edges": [{"source": "x", "target": "missing", "kind": "synergy", "weight": 0.5}],
        }
        response = self.client.post("/api/v1/graph/layout/", payload, format="json")
        self.assertEqual(response.status_code, 400)

    def test_post_rejects_weight_out_of_range(self):
        payload = {
            "nodes": [{"key": "x", "label": "X", "category": "trait"}],
            "edges": [{"source": "x", "target": "x", "kind": "synergy", "weight": 1.5}],
        }
        response = self.client.post("/api/v1/graph/layout/", payload, format="json")
        self.assertEqual(response.status_code, 400)
