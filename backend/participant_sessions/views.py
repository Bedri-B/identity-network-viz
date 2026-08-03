from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Session
from .serializers import SessionSaveSerializer, SessionSerializer


class SessionInitView(APIView):
    """URL-driven session bootstrap: `?pid=&tool=&classroom_code=` or `?sgic=`.

    - `sgic` given -> resume that exact session (crash recovery via a
      participant-remembered code).
    - `pid` given -> reuse their most recent in-progress session for this
      tool, or start a new one (Qualtrics participants get a stable identity
      across a dropped connection without needing to remember an SGIC).
    - neither -> a fresh session with a freshly generated SGIC (classroom /
      walk-up participants).
    """

    def get(self, request):
        sgic = request.query_params.get("sgic", "").strip()
        pid = request.query_params.get("pid", "").strip()
        tool = request.query_params.get("tool", "adult_variant_a")
        classroom_code = request.query_params.get("classroom_code", "").strip()

        if sgic:
            session = get_object_or_404(Session, sgic=sgic)
        elif pid:
            session = (
                Session.objects.filter(pid=pid, tool_type=tool, status="in_progress")
                .order_by("-created_at")
                .first()
            )
            if session is None:
                session = Session.objects.create(pid=pid, tool_type=tool, classroom_code=classroom_code)
        else:
            session = Session.objects.create(tool_type=tool, classroom_code=classroom_code)

        return Response(SessionSerializer(session).data)


class SessionResumeView(APIView):
    """Explicit crash-recovery lookup: GET /api/v1/sessions/resume/?sgic=..."""

    def get(self, request):
        sgic = request.query_params.get("sgic", "").strip()
        if not sgic:
            return Response({"detail": "sgic query parameter is required."}, status=400)
        session = get_object_or_404(Session, sgic=sgic)
        return Response(SessionSerializer(session).data)


class SessionSaveView(APIView):
    """Background autosave: merges a state patch and/or advances the phase."""

    def patch(self, request, sgic):
        session = get_object_or_404(Session, sgic=sgic)
        serializer = SessionSaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if "state_patch" in data:
            session.state = {**session.state, **data["state_patch"]}
        if "current_phase" in data:
            session.current_phase = data["current_phase"]
        if "status" in data:
            session.status = data["status"]
        session.save()

        return Response(SessionSerializer(session).data)
