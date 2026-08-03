from rest_framework import serializers

from .models import Session


class SessionSerializer(serializers.ModelSerializer):
    parent_session = serializers.SlugRelatedField(slug_field="sgic", read_only=True)

    class Meta:
        model = Session
        fields = [
            "sgic",
            "pid",
            "classroom_code",
            "tool_type",
            "parent_session",
            "current_phase",
            "status",
            "state",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["sgic", "created_at", "updated_at"]


class SessionSaveSerializer(serializers.Serializer):
    """Autosave payload: a phase transition and/or a partial state merge."""

    current_phase = serializers.ChoiceField(choices=Session.PHASE_CHOICES, required=False)
    status = serializers.ChoiceField(choices=Session.STATUS_CHOICES, required=False)
    state_patch = serializers.DictField(required=False)
