from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings


def _fernet():
    return Fernet(settings.FERNET_KEY)


def encrypt_password(raw: str) -> str:
    if not raw:
        return raw
    return _fernet().encrypt(raw.encode()).decode()


def decrypt_password(value: str) -> str:
    if not value:
        return value
    try:
        return _fernet().decrypt(value.encode()).decode()
    except InvalidToken:
        # Valeur déjà en clair (ancienne donnée non migrée) → on la renvoie telle quelle
        return value