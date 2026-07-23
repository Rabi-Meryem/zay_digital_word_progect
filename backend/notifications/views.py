from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from users.permissions import IsAdminRole

from notifications.models import (
    Notification,
    NotificationType,
    NotificationChannel,
    NotificationHistory,
)

from notifications.serializers import (
    NotificationSerializer,
    NotificationTypeSerializer,
    NotificationChannelSerializer,
    NotificationHistorySerializer,
)


# =====================================================
# NOTIFICATIONS UTILISATEUR
# Client / Agent / Superviseur
# =====================================================

class NotificationListView(APIView):
    """
    GET /api/notifications/?is_read=false&page=1&page_size=20
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Notification.objects.filter(
            user=request.user
        ).select_related(
            'notification_type',
            'ticket'
        ).order_by('-created_at')

        is_read = request.GET.get('is_read')

        if is_read is not None:
            queryset = queryset.filter(
                is_read=(is_read.lower() == 'true')
            )

        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))

        start = (page - 1) * page_size
        end = start + page_size

        total = queryset.count()

        unread_count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()

        return Response({
            "total": total,
            "unread_count": unread_count,
            "page": page,
            "page_size": page_size,
            "results": NotificationSerializer(
                queryset[start:end],
                many=True
            ).data,
        })


class NotificationMarkReadView(APIView):
    """
    PATCH /api/notifications/<id>/read/
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        try:
            notif = Notification.objects.get(
                pk=pk,
                user=request.user
            )

        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )

        notif.is_read = True
        notif.save(update_fields=["is_read"])

        return Response(
            NotificationSerializer(notif).data
        )


class NotificationMarkAllReadView(APIView):
    """
    POST /api/notifications/mark-all-read/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):

        updated = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).update(
            is_read=True
        )

        return Response({
            "detail": f"{updated} notification(s) marquée(s) comme lue(s)."
        })


class NotificationUnreadCountView(APIView):
    """
    GET /api/notifications/unread-count/
    Badge de la cloche
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):

        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()

        return Response({
            "unread_count": count
        })


# =====================================================
# ADMINISTRATION DES NOTIFICATIONS
# Admin uniquement
# =====================================================


class NotificationTypeListView(APIView):
    """
    GET /api/notifications/types/
    """
    permission_classes = [
        IsAuthenticated,
        IsAdminRole
    ]

    def get(self, request):

        types = NotificationType.objects.all().order_by('name')

        return Response(
            NotificationTypeSerializer(
                types,
                many=True
            ).data
        )


class NotificationTypeToggleView(APIView):
    """
    PATCH /api/notifications/types/<id>/

    Body:
    {
        "email_enabled": true,
        "in_app_enabled": false
    }
    """

    permission_classes = [
        IsAuthenticated,
        IsAdminRole
    ]

    def patch(self, request, pk):

        try:
            notif_type = NotificationType.objects.get(
                pk=pk
            )

        except NotificationType.DoesNotExist:
            return Response(
                {
                    "detail": "Type introuvable."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = NotificationTypeSerializer(
            notif_type,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                serializer.data
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class NotificationChannelListView(APIView):
    """
    GET /api/notifications/channels/
    """

    permission_classes = [
        IsAuthenticated,
        IsAdminRole
    ]

    def get(self, request):

        channels = NotificationChannel.objects.all().order_by(
            'name'
        )

        return Response(
            NotificationChannelSerializer(
                channels,
                many=True
            ).data
        )


class NotificationHistoryListView(APIView):
    """
    GET /api/notifications/history/?status=FAILED
    """

    permission_classes = [
        IsAuthenticated,
        IsAdminRole
    ]

    def get(self, request):

        history = NotificationHistory.objects.select_related(
            'notification',
            'notification__user',
            'channel'
        ).order_by(
            '-created_at'
        )

        status_filter = request.GET.get(
            'status'
        )

        if status_filter:
            history = history.filter(
                status=status_filter
            )

        return Response(
            NotificationHistorySerializer(
                history[:100],
                many=True
            ).data
        )