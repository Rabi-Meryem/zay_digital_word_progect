from django.urls import path

from integrations.views import (
    IMAPPollView,
    SMTPConfigurationView,
    IMAPConfigurationView,
    SMTPTestView,
    IMAPTestView,
)

urlpatterns = [
    path("integrations/imap/poll/", IMAPPollView.as_view(), name="imap-poll"),
    path("integrations/smtp/", SMTPConfigurationView.as_view(), name="smtp-config"),
    path("integrations/imap/", IMAPConfigurationView.as_view(), name="imap-config"),
    path("integrations/smtp/test/", SMTPTestView.as_view(), name="smtp-test"),
    path("integrations/imap/test/", IMAPTestView.as_view(), name="imap-test"),
]