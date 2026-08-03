from django.urls import path

from .views import CatalogView, GraphLayoutView

urlpatterns = [
    path("layout/", GraphLayoutView.as_view(), name="graph-layout"),
    path("catalog/", CatalogView.as_view(), name="catalog"),
]
