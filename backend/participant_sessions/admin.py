import csv

from django.contrib import admin
from django.http import HttpResponse

from graph.models import Item

from .models import Session


def export_wide_csv(modeladmin, request, queryset):
    """1 row = 1 participant session, structured for SPSS/R: base fields,
    one selected/importance column per catalog item, and one kind+weight
    column pair per possible item combination -- regenerated from the live
    catalog on every export, so it stays correct as items are added."""

    item_keys = list(Item.objects.order_by("key").values_list("key", flat=True))
    pairs = [(a, b) for i, a in enumerate(item_keys) for b in item_keys[i + 1 :]]

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="sessions_wide_export.csv"'
    writer = csv.writer(response)

    header = ["sgic", "pid", "tool_type", "status", "current_phase", "created_at", "updated_at"]
    header += [f"selected__{key}" for key in item_keys]
    header += [f"importance__{key}" for key in item_keys]
    header += [f"rel__{a}__{b}__{field}" for a, b in pairs for field in ("kind", "weight")]
    writer.writerow(header)

    for session in queryset:
        selected = set(session.state.get("selected_items", []))
        importance = session.state.get("importance", {})
        rel_by_pair = {
            tuple(sorted([rel["source"], rel["target"]])): rel
            for rel in session.state.get("relations", [])
        }

        row = [
            session.sgic,
            session.pid,
            session.tool_type,
            session.status,
            session.current_phase,
            session.created_at.isoformat(),
            session.updated_at.isoformat(),
        ]
        row += [1 if key in selected else 0 for key in item_keys]
        row += [importance.get(key, "") for key in item_keys]
        for a, b in pairs:
            rel = rel_by_pair.get((a, b))
            row += [rel["kind"], rel["weight"]] if rel else ["", ""]
        writer.writerow(row)

    return response


export_wide_csv.short_description = "Export selected sessions as wide CSV (SPSS/R-ready)"


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("sgic", "pid", "tool_type", "status", "current_phase", "updated_at")
    list_filter = ("tool_type", "status")
    search_fields = ("sgic", "pid", "classroom_code")
    actions = [export_wide_csv]
