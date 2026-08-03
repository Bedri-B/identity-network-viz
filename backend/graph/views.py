from rest_framework.response import Response
from rest_framework.views import APIView

from .layout import build_layout_response
from .models import Item, Relation
from .serializers import GraphLayoutRequestSerializer, ItemModelSerializer, RelationModelSerializer


class GraphLayoutView(APIView):
    """
    GET  -> layout for the seeded sample identity network (DB-backed).
    POST -> layout for an arbitrary {nodes, edges} payload (not persisted),
            e.g. a real participant's post-Phase-4 item catalog + pairwise ratings.
    """

    def get(self, request):
        items = ItemModelSerializer(Item.objects.all(), many=True).data
        relations = RelationModelSerializer(Relation.objects.select_related("source", "target"), many=True).data
        return Response(build_layout_response(items, relations))

    def post(self, request):
        serializer = GraphLayoutRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        return Response(build_layout_response(data["nodes"], data["edges"]))
