import random
import string

from django.db import models

SGIC_ALPHABET = string.ascii_uppercase + string.digits


def generate_sgic():
    """8-character Self-Generated Identification Code, for participants with no pid/classroom code."""
    return "".join(random.choices(SGIC_ALPHABET, k=8))


class Session(models.Model):
    """A participant's run through one of the four tool flows.

    URL-driven: initialized from Qualtrics `?pid=` params, a classroom code, or
    a bare SGIC. `state` is a free-form JSON blob (selected items, importance
    ratings, pairwise relations) autosaved on every phase transition so a
    dropped connection can resume exactly where the participant left off.
    """

    TOOL_CHOICES = [
        ("adult_variant_a", "Adult Future Work Self — Variant A (Guided Revision)"),
        ("adult_variant_b", "Adult Future Work Self — Variant B (Redo Baseline)"),
        ("youth", "Youth Career & Future Self Explorer"),
        ("leadership", "Adult Leadership Identity Tool"),
    ]

    STATUS_CHOICES = [
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]

    PHASE_CHOICES = [
        (1, "Card Discovery & Refinement"),
        (3, "Importance Rating"),
        (4, "Pairwise Synergy/Tension Mapping"),
        (5, "Qualtrics Survey Redirect"),
        (6, "Visual Feedback Report"),
    ]

    sgic = models.CharField(max_length=8, unique=True, default=generate_sgic, editable=False)
    pid = models.CharField(max_length=64, blank=True, db_index=True)
    classroom_code = models.CharField(max_length=32, blank=True)
    tool_type = models.CharField(max_length=20, choices=TOOL_CHOICES, default="adult_variant_a")
    parent_session = models.ForeignKey(
        "self", null=True, blank=True, related_name="child_sessions", on_delete=models.SET_NULL
    )
    current_phase = models.PositiveSmallIntegerField(choices=PHASE_CHOICES, default=1)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="in_progress")
    state = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.sgic} ({self.tool_type}, phase {self.current_phase})"
