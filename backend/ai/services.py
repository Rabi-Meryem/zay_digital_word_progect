# backend/ai/services.py
# ---------------------------------------------------------------------------
# Utilisateur système « IA ».
#
# Pourquoi ce fichier existe : ai_auto_process affecte un agent en appelant
# assign_ticket(ticket, agent, assigned_by). Or `assigned_by` est NOT NULL
# dans ticket_assignments, et `changed_by` l'est aussi dans
# ticket_status_history. Passer None fait remonter un IntegrityError qui,
# la méthode étant @transaction.atomic, annule TOUT le traitement — y compris
# la criticité qui venait d'être calculée correctement.
#
# Deux corrections possibles : rendre ces colonnes nullables (elles
# appartiennent aux modèles de Meryem), ou fournir un utilisateur système.
# La seconde est retenue : elle ne touche à aucun modèle partagé et laisse
# une trace lisible dans l'historique (« affecté par IA ZAY »).
# ---------------------------------------------------------------------------

EMAIL_UTILISATEUR_IA = "ia@zay.ma"

_cache = {}


def get_utilisateur_ia():
    """Renvoie l'utilisateur système représentant l'IA, en le créant au besoin.

    Compte inactif : il ne peut pas se connecter, il ne sert qu'à signer
    les affectations et les changements de statut décidés automatiquement.
    """
    from users.models import User, Role

    if "user" in _cache:
        return _cache["user"]

    utilisateur = User.objects.filter(email=EMAIL_UTILISATEUR_IA).first()

    if utilisateur is None:
        role, _ = Role.objects.get_or_create(
            name=Role.RoleName.ADMIN,
            defaults={"description": "Administrateur"},
        )
        utilisateur = User(
            email=EMAIL_UTILISATEUR_IA,
            first_name="IA",
            last_name="ZAY",
            role=role,
            is_active=False,   # aucun accès au portail
            is_staff=False,
        )
        utilisateur.set_unusable_password()
        utilisateur.save()

    _cache["user"] = utilisateur
    return utilisateur
