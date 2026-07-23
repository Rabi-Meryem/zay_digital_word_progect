from django.urls import path
from .views import (
    NotificationListView, NotificationMarkReadView,
    NotificationMarkAllReadView, NotificationUnreadCountView,
    NotificationTypeListView, NotificationTypeToggleView,
    NotificationChannelListView, NotificationHistoryListView,
)

urlpatterns = [
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/unread-count/', NotificationUnreadCountView.as_view(), name='notification-unread-count'),
    path('notifications/<int:pk>/read/', NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('notifications/mark-all-read/', NotificationMarkAllReadView.as_view(), name='notification-mark-all-read'),
    path('notifications/types/', NotificationTypeListView.as_view(), name='notification-type-list'),
    path('notifications/types/<int:pk>/', NotificationTypeToggleView.as_view(), name='notification-type-toggle'),
    path('notifications/channels/', NotificationChannelListView.as_view(), name='notification-channel-list'),
    path('notifications/history/', NotificationHistoryListView.as_view(), name='notification-history'),
]