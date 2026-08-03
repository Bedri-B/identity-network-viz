from rest_framework import serializers

from .models import Item, Relation


class ItemModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ["key", "label", "category"]


class RelationModelSerializer(serializers.ModelSerializer):
    source = serializers.SlugRelatedField(slug_field="key", queryset=Item.objects.all())
    target = serializers.SlugRelatedField(slug_field="key", queryset=Item.objects.all())

    class Meta:
        model = Relation
        fields = ["source", "target", "kind", "weight"]


class ItemInputSerializer(serializers.Serializer):
    """Ad-hoc item for a one-off /layout/ POST (not persisted)."""

    key = serializers.SlugField()
    label = serializers.CharField(max_length=120)
    category = serializers.ChoiceField(choices=Item.CATEGORY_CHOICES)


class RelationInputSerializer(serializers.Serializer):
    source = serializers.SlugField()
    target = serializers.SlugField()
    kind = serializers.ChoiceField(choices=Relation.KIND_CHOICES)
    weight = serializers.FloatField(min_value=0, max_value=1)


class GraphLayoutRequestSerializer(serializers.Serializer):
    nodes = ItemInputSerializer(many=True)
    edges = RelationInputSerializer(many=True)

    def validate(self, attrs):
        node_keys = {node["key"] for node in attrs["nodes"]}
        for edge in attrs["edges"]:
            if edge["source"] not in node_keys or edge["target"] not in node_keys:
                raise serializers.ValidationError(
                    "Every edge source/target must reference a node key in `nodes`."
                )
        return attrs
