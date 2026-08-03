from django.urls import path

from .views import GraphLayoutView

urlpatterns = [
    path("layout/", GraphLayoutView.as_view(), name="graph-layout"),
]
