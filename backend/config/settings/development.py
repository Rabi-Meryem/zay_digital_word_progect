from .base import *

DEBUG = True
CORS_ALLOW_ALL_ORIGINS = True   # Autorise l'envoi des cookies et du token JWT
# Autorise votre frontend React à parler au backend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite (React)
]