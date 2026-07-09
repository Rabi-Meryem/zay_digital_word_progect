from django.shortcuts import render

# Dans tickets/views.py quand un ticket est créé
from notifications.notification_service import notification_service

notification_service.notify(
    event_type="TICKET_CREATED",
    ticket=ticket,
    recipients=[ticket.client, supervisor]
)