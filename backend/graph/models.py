from django.db import models


class Item(models.Model):
    """A node in a participant's cognitive identity network (a skill, value, or trait)."""

    CATEGORY_CHOICES = [
        ("skill", "Skill"),
        ("value", "Value"),
        ("trait", "Trait"),
    ]

    key = models.SlugField(unique=True)
    label = models.CharField(max_length=120)
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES)

    def __str__(self):
        return self.label


class Relation(models.Model):
    """A pairwise synergy/tension edge between two items, rated by a participant."""

    KIND_CHOICES = [
        ("synergy", "Synergy"),
        ("tension", "Tension"),
    ]

    source = models.ForeignKey(Item, related_name="outgoing", on_delete=models.CASCADE)
    target = models.ForeignKey(Item, related_name="incoming", on_delete=models.CASCADE)
    kind = models.CharField(max_length=10, choices=KIND_CHOICES)
    weight = models.FloatField(help_text="Strength rating in [0, 1] from the pairwise mapping phase.")

    class Meta:
        unique_together = ("source", "target")

    def __str__(self):
        return f"{self.source} --{self.kind}({self.weight})--> {self.target}"
