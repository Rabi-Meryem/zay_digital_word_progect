from django.urls import path
from integrations.views import IMAPPollView

urlpatterns = [
    path("integrations/imap/poll/", IMAPPollView.as_view(), name="imap-poll"),
]