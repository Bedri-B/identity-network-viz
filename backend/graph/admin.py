from django.contrib import admin

from .models import Item, Relation


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ("label", "key", "category")
    list_filter = ("category",)
    search_fields = ("label", "key")


@admin.register(Relation)
class RelationAdmin(admin.ModelAdmin):
    list_display = ("source", "target", "kind", "weight")
    list_filter = ("kind",)
    autocomplete_fields = ("source", "target")
