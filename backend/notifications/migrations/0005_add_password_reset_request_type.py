from django.db import migrations


def create_notification_type(apps, schema_editor):
    NotificationType = apps.get_model('notifications', 'NotificationType')
    NotificationType.objects.get_or_create(
        name='PASSWORD_RESET_REQUEST',
        defaults={
            'description': "Demande de réinitialisation de mot de passe transmise à l'administrateur",
            'email_enabled': False,   # pas de template email dédié pour l'instant
            'in_app_enabled': True,
        },
    )


def remove_notification_type(apps, schema_editor):
    NotificationType = apps.get_model('notifications', 'NotificationType')
    NotificationType.objects.filter(name='PASSWORD_RESET_REQUEST').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0004_notificationtype_email_enabled_and_more'), 
    ]

    operations = [
        migrations.RunPython(create_notification_type, remove_notification_type),
    ]