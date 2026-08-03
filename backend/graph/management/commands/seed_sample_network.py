from django.core.management.base import BaseCommand

from graph.models import Item, Relation
from graph.sample_data import ITEMS, RELATIONS


class Command(BaseCommand):
    help = "Seed the DB with a sample Future-Work-Self identity network for the /layout/ demo."

    def handle(self, *args, **options):
        for item in ITEMS:
            Item.objects.update_or_create(key=item["key"], defaults=item)

        for source_key, target_key, kind, weight in RELATIONS:
            Relation.objects.update_or_create(
                source=Item.objects.get(key=source_key),
                target=Item.objects.get(key=target_key),
                defaults={"kind": kind, "weight": weight},
            )

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(ITEMS)} items and {len(RELATIONS)} relations."
        ))
