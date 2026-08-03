from django.urls import path

from .views import SessionInitView, SessionResumeView, SessionSaveView

urlpatterns = [
    path("sessions/init/", SessionInitView.as_view(), name="session-init"),
    path("sessions/resume/", SessionResumeView.as_view(), name="session-resume"),
    path("sessions/<str:sgic>/save/", SessionSaveView.as_view(), name="session-save"),
]
