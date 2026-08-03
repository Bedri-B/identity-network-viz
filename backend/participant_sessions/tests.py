import csv
import io

from django.test import TestCase
from rest_framework.test import APIClient

from graph.models import Item

from .admin import export_wide_csv
from .models import Session


class SessionInitViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_no_params_creates_fresh_session_with_sgic(self):
        response = self.client.get("/api/v1/sessions/init/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["sgic"]), 8)
        self.assertEqual(response.data["current_phase"], 1)
        self.assertEqual(response.data["status"], "in_progress")

    def test_pid_reuses_in_progress_session_for_same_tool(self):
        first = self.client.get("/api/v1/sessions/init/?pid=P123&tool=youth")
        second = self.client.get("/api/v1/sessions/init/?pid=P123&tool=youth")
        self.assertEqual(first.data["sgic"], second.data["sgic"])
        self.assertEqual(Session.objects.filter(pid="P123").count(), 1)

    def test_pid_does_not_reuse_across_different_tools(self):
        first = self.client.get("/api/v1/sessions/init/?pid=P999&tool=youth")
        second = self.client.get("/api/v1/sessions/init/?pid=P999&tool=leadership")
        self.assertNotEqual(first.data["sgic"], second.data["sgic"])

    def test_pid_does_not_reuse_a_completed_session(self):
        first = self.client.get("/api/v1/sessions/init/?pid=P555&tool=youth")
        session = Session.objects.get(sgic=first.data["sgic"])
        session.status = "completed"
        session.save()
        second = self.client.get("/api/v1/sessions/init/?pid=P555&tool=youth")
        self.assertNotEqual(first.data["sgic"], second.data["sgic"])

    def test_sgic_resumes_exact_session(self):
        created = self.client.get("/api/v1/sessions/init/?pid=P1&tool=leadership")
        resumed = self.client.get(f"/api/v1/sessions/init/?sgic={created.data['sgic']}")
        self.assertEqual(created.data["sgic"], resumed.data["sgic"])
        self.assertEqual(resumed.data["tool_type"], "leadership")

    def test_unknown_sgic_returns_404(self):
        response = self.client.get("/api/v1/sessions/init/?sgic=NOPE0000")
        self.assertEqual(response.status_code, 404)


class SessionResumeViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_missing_sgic_is_a_400(self):
        response = self.client.get("/api/v1/sessions/resume/")
        self.assertEqual(response.status_code, 400)

    def test_found_session_returns_full_state(self):
        session = Session.objects.create(tool_type="adult_variant_a", state={"selected_items": ["a"]})
        response = self.client.get(f"/api/v1/sessions/resume/?sgic={session.sgic}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["state"]["selected_items"], ["a"])

    def test_unknown_sgic_is_a_404(self):
        response = self.client.get("/api/v1/sessions/resume/?sgic=NOPE0000")
        self.assertEqual(response.status_code, 404)


class SessionSaveViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.session = Session.objects.create(tool_type="adult_variant_a")

    def test_state_patch_merges_without_clobbering_other_keys(self):
        self.client.patch(
            f"/api/v1/sessions/{self.session.sgic}/save/",
            {"state_patch": {"selected_items": ["a", "b"]}},
            format="json",
        )
        self.client.patch(
            f"/api/v1/sessions/{self.session.sgic}/save/",
            {"state_patch": {"importance": {"a": 5}}},
            format="json",
        )
        self.session.refresh_from_db()
        self.assertEqual(self.session.state["selected_items"], ["a", "b"])
        self.assertEqual(self.session.state["importance"], {"a": 5})

    def test_advances_current_phase(self):
        response = self.client.patch(
            f"/api/v1/sessions/{self.session.sgic}/save/",
            {"current_phase": 4},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.session.refresh_from_db()
        self.assertEqual(self.session.current_phase, 4)

    def test_rejects_invalid_phase(self):
        response = self.client.patch(
            f"/api/v1/sessions/{self.session.sgic}/save/",
            {"current_phase": 2},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_can_mark_completed(self):
        response = self.client.patch(
            f"/api/v1/sessions/{self.session.sgic}/save/",
            {"status": "completed"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "completed")

    def test_unknown_sgic_is_a_404(self):
        response = self.client.patch(
            "/api/v1/sessions/NOPE0000/save/", {"current_phase": 4}, format="json"
        )
        self.assertEqual(response.status_code, 404)


class ExportWideCsvTests(TestCase):
    def setUp(self):
        self.item_a = Item.objects.create(key="alpha", label="Alpha", category="skill")
        self.item_b = Item.objects.create(key="beta", label="Beta", category="value")
        self.session = Session.objects.create(
            tool_type="adult_variant_a",
            pid="P1",
            state={
                "selected_items": ["alpha", "beta"],
                "importance": {"alpha": 4, "beta": 2},
                "relations": [{"source": "alpha", "target": "beta", "kind": "synergy", "weight": 0.7}],
            },
        )

    def test_header_has_one_column_set_per_item_and_pair(self):
        response = export_wide_csv(None, None, Session.objects.filter(pk=self.session.pk))
        rows = list(csv.reader(io.StringIO(response.content.decode())))
        header = rows[0]
        self.assertIn("selected__alpha", header)
        self.assertIn("importance__beta", header)
        self.assertIn("rel__alpha__beta__kind", header)
        self.assertIn("rel__alpha__beta__weight", header)

    def test_row_reflects_session_state(self):
        response = export_wide_csv(None, None, Session.objects.filter(pk=self.session.pk))
        rows = list(csv.reader(io.StringIO(response.content.decode())))
        header, row = rows[0], rows[1]
        as_dict = dict(zip(header, row))
        self.assertEqual(as_dict["sgic"], self.session.sgic)
        self.assertEqual(as_dict["selected__alpha"], "1")
        self.assertEqual(as_dict["importance__beta"], "2")
        self.assertEqual(as_dict["rel__alpha__beta__kind"], "synergy")
        self.assertEqual(as_dict["rel__alpha__beta__weight"], "0.7")

    def test_session_missing_a_relation_leaves_blank_columns(self):
        bare_session = Session.objects.create(tool_type="youth")
        response = export_wide_csv(None, None, Session.objects.filter(pk=bare_session.pk))
        rows = list(csv.reader(io.StringIO(response.content.decode())))
        as_dict = dict(zip(rows[0], rows[1]))
        self.assertEqual(as_dict["selected__alpha"], "0")
        self.assertEqual(as_dict["rel__alpha__beta__kind"], "")
