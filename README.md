# ZAY Digital World
# Backend – Journal de développement
Le 30/06/2026
## 1. Organisation de la configuration Django

La configuration du projet a été organisée dans le dossier `backend/config/settings` afin de séparer les paramètres selon l'environnement d'exécution.

```
backend/
└── config/
    └── settings/
        ├── base.py
        ├── development.py
        └── production.py
```

### Rôle de chaque fichier

* **base.py**

  * Contient toute la configuration commune du projet (applications installées, connexion PostgreSQL, Redis, MinIO, Django REST Framework, JWT, stockage des fichiers, etc.).

* **development.py**

  * Hérite de `base.py` et contient les paramètres utilisés pendant le développement (mode DEBUG, CORS, etc.).

* **production.py**

  * Hérite également de `base.py` et contient les paramètres utilisés lors du déploiement du projet (HTTPS, sécurité, cookies sécurisés, etc.).

---

# 2. Configuration Docker

Un fichier **`docker-compose.yml`** a été créé afin de lancer automatiquement les différents services utilisés par le projet.

Les services configurés sont :

* PostgreSQL
* Redis
* MinIO

### Lancement des conteneurs

docker compose up -d


### Vérification


docker ps



# 3. Configuration des variables d'environnement

Le fichier **`.env`** a été configuré afin de centraliser toutes les informations sensibles du projet :

* Clé secrète Django
* Configuration PostgreSQL
* Configuration Redis
* Configuration MinIO
* Configuration de l'API IA
* Configuration CORS

---

# 4. Architecture des modèles

## Application `users`

```
users/
└── models/
    ├── user.py
    ├── role.py
    ├── login_history.py
    └── agent_availability.py
```

---

## Application `sla`

```
sla/
└── models/
    ├── sla_rule.py
    └── sla_history.py
```

---

## Application `tickets`

```
tickets/
└── models/
    ├── ticket.py
    ├── ticket_assignment.py
    ├── ticket_attachment.py
    ├── ticket_rating.py
    └── ticket_status_history.py
```

---

## Application `escalation`

```
escalation/
└── models.py
```

Cette application gère l'historique des escalades des tickets.

---

## Application `messages_app`

```
messages_app/
└── models/
    ├── ticket_message.py
    └── message_attachment.py
```

---

## Application `notifications`

```
notifications/
└── models/
    ├── notification.py
    ├── notification_type.py
    ├── notification_channel.py
    └── notification_history.py
```

---

## Application `reports`

```
reports/
└── models/
    ├── report.py
    └── agent_statistics.py
```

---

## Application `integrations`

```
integrations/
└── models/
    ├── smtp_configuration.py
    └── imap_configuration.py
```

---

## Application `logs_app`

```
logs_app/
└── models.py
```

Cette application enregistre les journaux (logs) et les actions réalisées dans le système.

---

# 5. Génération des migrations

Après la création de tous les modèles, les migrations Django ont été générées afin de préparer la création des tables dans PostgreSQL.

Commande utilisée :


python manage.py makemigrations


Puis les migrations ont été appliquées avec :


python manage.py migrate




# 6. Configuration de PostgreSQL avec DBeaver

Pour administrer la base de données, DBeaver est utilisé comme interface graphique.

Configuration de la connexion :


Host : localhost
Port : 5432
Database : zay_db
Username : postgres
Password : zay1234

Une fois connecté, DBeaver permet de visualiser les tables, d'exécuter des requêtes SQL et d'administrer la base de données.


# 7. Extensions Visual Studio Code

Les extensions suivantes ont été installées afin de faciliter le développement.

Extension	                              Utilité
Python	                                  Support complet du développement Python
Pylance	                                  Autocomplétion intelligente et analyse du code Python
Prettier                               	  Formatage automatique du code
ESLint	                                  Détection des erreurs JavaScript et React
Tailwind CSS IntelliSense	              Autocomplétion des classes Tailwind CSS
GitLens	                                  Outils avancés pour Git et GitHub

Installation :

code --install-extension ms-python.python
code --install-extension ms-python.pylance
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
code --install-extension eamodio.gitlens


# 8. Création de l'environnement virtuel

Création :

python -m venv venv

Activation sous Windows :

venv\Scripts\activate

L'environnement virtuel permet d'isoler toutes les dépendances Python du projet afin d'éviter les conflits avec les autres projets.

# 9. Dépendances Python principales

Les dépendances du backend sont centralisées dans le fichier requirements.txt.

Principales bibliothèques utilisées :

Bibliothèque	                   Utilité
Django	                           Framework Backend
Django REST Framework	           Développement des API REST
psycopg2-binary	                   Connexion PostgreSQL
python-decouple	                   Gestion des variables d'environnement
channels	                       WebSockets
channels-redis	                   Communication temps réel avec Redis
django-redis	                   Cache Redis
django-storages	                   Gestion des fichiers
boto3	                           Communication avec MinIO
APScheduler	                       Planification de tâches
drf-spectacular	                   Documentation Swagger/OpenAPI
django-filter	                   Filtrage des API
djangorestframework-simplejwt	   Authentification JWT
reportlab	                       Génération de rapports PDF
openpyxl                           Génération de fichiers Excel
pytest	                           Tests unitaires

# 10. Frontend

Création du projet :

npm create vite@latest . -- --template react

Installation des dépendances :

npm install

Principales bibliothèques :

Bibliothèque	       Utilité
React	               Interface utilisateur
Vite	               Outil de développement
Axios	               Appels API
React Router	       Navigation
Redux Toolkit	       Gestion de l'état global
React Redux	           Intégration Redux
React Hook Form	       Gestion des formulaires
Zod	                   Validation des données
React Use WebSocket	   Communication temps réel
Recharts	           Graphiques
Date-fns	           Manipulation des dates
React Hot Toast	       Notifications
Lucide React	       Icônes

# 10. Tailwind CSS

Installation :

npm install -D tailwindcss postcss autoprefixer

npx tailwindcss init -p

Utilité :

Tailwind CSS est utilisé pour créer rapidement une interface moderne à l'aide de classes utilitaires.

Shadcn/UI

Initialisation :

npx shadcn-ui@latest init

Composants installés :

Button
Input
Card
Badge
Table
Tabs
Dialog
Select
Textarea
Avatar
Dropdown Menu
Toast
Alert
Progress
Skeleton

Shadcn/UI fournit des composants React modernes, réutilisables et entièrement personnalisables.

# 11. Installation des dépendances PostgreSQL

Se placer dans le dossier du backend :

cd backend


Installer les bibliothèques nécessaires à la connexion avec PostgreSQL et à la gestion des variables d'environnement :

pip install psycopg2-binary python-decouple


### Utilité des bibliothèques

 Bibliothèque	                       Utilité
psycopg2-binary                    	   Pilote PostgreSQL permettant à Django de communiquer avec la base de données PostgreSQL.

python-decouple                      	Permet de lire les variables d'environnement définies dans le fichier .env afin de ne pas stocker les informations sensibles directement dans le code.

### Mettre à jour le fichier `requirements.txt` :
pip freeze > requirements.txt


Cette commande enregistre toutes les dépendances Python installées dans le projet afin de pouvoir les réinstaller facilement sur une autre machine avec :


pip install -r requirements.txt


# 12. Installation du stockage MinIO

Afin de permettre le stockage des pièces jointes (tickets, messages, rapports PDF, etc.) dans MinIO, les bibliothèques suivantes ont été installées :

pip install django-storages boto3

### Utilité des bibliothèques
Bibliothèque	                    Utilité
django-storages                   	Fournit un système de stockage permettant à Django d'utiliser des services compatibles avec Amazon S3 comme MinIO.

boto3                            	SDK officiel d'Amazon Web Services utilisé par Django pour communiquer avec MinIO via l'API S3.


# Module d'intégration Email (SMTP / IMAP)

Le projet intègre un système complet de gestion des emails permettant l'envoi automatique de notifications et la création de tickets à partir des emails reçus.

---

## 1. Service SMTP (`backend/integrations/email_service.py`)

Le service `EmailService` centralise l'envoi des emails de l'application.

### Fonctionnement

- Récupère automatiquement la configuration SMTP active depuis la base de données (`SMTPConfiguration`).
- Établit une connexion sécurisée avec le serveur SMTP (SSL ou TLS).
- Génère le message (texte et/ou HTML).
- Envoie l'email au destinataire.
- Enregistre chaque tentative d'envoi dans les journaux (`AuditLog`).
- Les paramètres SMTP peuvent être modifiés par l'administrateur sans redémarrer l'application.

---

## 2. Templates d'emails (`backend/integrations/email_templates/`)

Chaque type de notification possède son propre modèle HTML.

Templates disponibles :

- `ticket_created.html`
- `ticket_assigned.html`
- `ticket_resolved.html`
- `sla_warning.html`
- `sla_exceeded.html`
- `new_message.html`

Ces modèles sont remplis dynamiquement avec les informations du ticket (numéro, titre, priorité, délai SLA, lien vers le portail, etc.) avant l'envoi.

---

## 3. Notification Service (`backend/notifications/notification_service.py`)

Le `NotificationService` constitue le point central de gestion des notifications.

### Responsabilités

- Détecter le type d'événement métier.
- Créer les notifications in-app.
- Sélectionner le template d'email approprié.
- Générer le contenu HTML.
- Appeler `EmailService` pour l'envoi.
- Enregistrer l'historique des notifications.

Exemples d'événements pris en charge :

- Création d'un ticket
- Affectation d'un ticket
- Nouveau message
- Ticket résolu
- Alerte SLA
- Dépassement SLA
- Réouverture d'un ticket
- Escalade

---

## 4. Service IMAP (`backend/integrations/imap_service.py`)

Le service `IMAPService` permet la création automatique de tickets à partir des emails reçus.

### Fonctionnement

- Connexion au serveur IMAP.
- Lecture des emails non lus.
- Extraction de :
  - l'expéditeur,
  - l'objet,
  - le contenu du message.
- Vérification que l'expéditeur correspond à un utilisateur existant.
- Création automatique d'un ticket.
- Affectation d'une priorité et d'une règle SLA par défaut.
- Marquage de l'email comme traité.

---

## 5. Endpoint de polling IMAP (`backend/integrations/views.py`)

Un endpoint REST sécurisé permet de lancer la lecture de la boîte mail.

```
POST /api/integrations/imap/poll/
```

Fonctionnement :

- Vérification d'un token secret (`X-Cron-Secret`).
- Appel du `IMAPService`.
- Retour du nombre de tickets créés.

---

## 6. Exécution automatique

La consultation de la boîte mail est réalisée automatiquement grâce à un Cron Job (Linux) ou au Task Scheduler (Windows).

Toutes les deux minutes, le planificateur appelle l'endpoint :

```
POST /api/integrations/imap/poll/
```

Le système vérifie alors les nouveaux emails et crée automatiquement les tickets correspondants.

---

## Architecture générale

```
Utilisateur
      │
      ▼
Création / Modification d'un ticket
      │
      ▼
NotificationService
      │
      ├──────────────► Notification In-App
      │
      └──────────────► EmailService
                             │
                             ▼
                        Serveur SMTP
                             │
                             ▼
                        Destinataire

----------------------------------------------------

Client envoie un email
        │
        ▼
Serveur IMAP
        │
        ▼
Cron Job (2 min)
        │
        ▼
IMAPPollView
        │
        ▼
IMAPService
        │
        ▼
Création automatique d'un Ticket
```

## Avantages de cette architecture

- Séparation claire entre la logique métier et les intégrations.
- Configuration SMTP et IMAP modifiable par l'administrateur sans redémarrage.
- Réutilisation du service d'envoi d'emails dans toute l'application.
- Création automatique des tickets depuis une boîte mail.
- Historisation des notifications et des envois.
- Architecture modulaire, évolutive et facilement maintenable.



###  Gestion avancée des utilisateurs (Administration)

Afin d'améliorer la gestion des comptes utilisateurs, plusieurs mécanismes techniques ont été ajoutés au module d'administration.

#### 1. Filtrage dynamique des utilisateurs

Un système de filtrage basé sur **django-filter** a été intégré afin de permettre à l'administrateur de rechercher rapidement des utilisateurs selon plusieurs critères.

Les filtres disponibles sont :

- Rôle (Administrateur, Superviseur, Agent, Client)
- Statut du compte (Actif / Désactivé)
- Recherche par prénom, nom ou adresse e-mail

Cette approche évite d'écrire manuellement la logique de filtrage dans les vues et facilite l'ajout de nouveaux critères à l'avenir.

---

#### 2. Serializer dédié à la liste des utilisateurs

Un serializer spécifique (`UserListSerializer`) a été créé pour les opérations d'administration.

Contrairement au serializer standard, il retourne des informations supplémentaires telles que :

- Nom complet
- Informations du rôle
- Libellé du statut (Actif / Désactivé)
- Date de création
- Dernière connexion

Cette séparation permet d'adapter les données retournées selon le contexte d'utilisation tout en conservant un code plus modulaire.

---

#### 3. Gestion avancée des comptes utilisateurs

Les vues d'administration ont été enrichies afin de prendre en charge :

- La création d'utilisateurs.
- La consultation détaillée des comptes.
- La modification des informations d'un utilisateur.
- La désactivation logique (Soft Delete) d'un compte.
- La réactivation d'un compte désactivé.
- La réinitialisation du mot de passe.

Des contrôles supplémentaires empêchent notamment un administrateur de modifier son propre rôle ou de désactiver son propre compte.

---

#### 4. Tri des utilisateurs

La liste des utilisateurs prend en charge un tri dynamique permettant de classer les résultats selon plusieurs champs :

- Date de création
- Nom
- Adresse e-mail
- Rôle

Le tri est effectué directement au niveau de la requête SQL afin d'améliorer les performances.

---

#### 5. Journalisation des actions administrateur

Toutes les opérations sensibles réalisées sur les utilisateurs sont automatiquement enregistrées dans les journaux d'audit (Audit Logs).

Les actions enregistrées comprennent notamment :

- Création d'un utilisateur.
- Modification d'un compte.
- Désactivation d'un compte.
- Réactivation d'un compte.
- Réinitialisation du mot de passe.

Chaque journal conserve l'utilisateur ayant effectué l'action, la date, l'adresse IP et le navigateur utilisé afin d'assurer une traçabilité complète.

### Fichiers concernés

| Fichier | Description |
|---------|-------------|
| `backend/users/filters.py` | Implémente les filtres avancés des utilisateurs avec **django-filter** (rôle, statut, recherche). |
| `backend/users/serializers.py` | Ajoute `UserListSerializer` pour retourner des informations détaillées sur les utilisateurs. |
| `backend/users/views.py` | Contient la logique métier de gestion des utilisateurs (CRUD, filtres, tri, activation, désactivation, réinitialisation du mot de passe). |
| `backend/users/urls.py` | Définit les endpoints REST du module d'administration des utilisateurs. |


## Audit des actions, journalisation et détection des anomalies

### Objectif

Afin d'améliorer la sécurité et la traçabilité de la plateforme, un module d'audit a été mis en place. Celui-ci enregistre automatiquement les actions importantes réalisées dans le système, permet leur consultation par l'administrateur et détecte certaines anomalies de sécurité.

---

### Principe de fonctionnement

Le système repose sur trois composants principaux :

- **Journalisation (Audit Logs)** : chaque action importante est enregistrée automatiquement dans une table d'audit.
- **Consultation des logs** : l'administrateur peut consulter, rechercher, filtrer et analyser l'ensemble des événements enregistrés.
- **Détection automatique des anomalies** : certaines règles permettent de détecter des comportements suspects et de générer des alertes de sécurité.

---

### Techniques implémentées

#### 1. Consultation des journaux d'audit

Une API dédiée permet à l'administrateur de consulter tous les journaux d'audit enregistrés dans le système.

Les fonctionnalités disponibles sont :

- consultation de tous les logs ;
- recherche dans les descriptions et les utilisateurs ;
- filtrage par type d'action ;
- filtrage par utilisateur ;
- filtrage par modèle cible ;
- filtrage par adresse IP ;
- filtrage par période ;
- affichage uniquement des événements suspects ;
- tri chronologique des résultats ;
- pagination des données.

Le filtrage est implémenté à l'aide de **django-filter** afin d'éviter une logique de recherche manuelle dans les vues.

---

#### 2. Serializer dédié aux journaux

Un serializer spécifique (`AuditLogSerializer`) a été développé afin de simplifier les données envoyées au frontend.

Il enrichit automatiquement les réponses avec :

- le nom complet de l'utilisateur ;
- son adresse e-mail ;
- un libellé lisible de l'action réalisée ;
- les informations de sécurité (adresse IP, navigateur, statut suspect).

Cette approche évite au frontend d'effectuer plusieurs requêtes pour récupérer les informations liées à un utilisateur.

---

#### 3. Audit des actions

Toutes les opérations importantes réalisées dans la plateforme sont enregistrées automatiquement.

Par exemple :

- connexion ;
- échec de connexion ;
- déconnexion ;
- création ;
- modification ;
- suppression ;
- affectation ;
- escalade ;
- envoi d'e-mail ;
- alertes de sécurité.

Chaque journal conserve notamment :

- l'utilisateur concerné ;
- la date et l'heure ;
- l'adresse IP ;
- le navigateur utilisé ;
- l'objet concerné ;
- une description de l'action.

---

#### 4. Détection automatique des anomalies

Le système surveille automatiquement les connexions afin de détecter des comportements suspects.

Trois règles de détection ont été implémentées :

**Règle 1 — Détection de brute force par adresse IP**

Une alerte est générée lorsqu'une même adresse IP effectue **5 échecs de connexion en moins de 15 minutes**.

---

**Règle 2 — Tentatives répétées sur un même compte**

Une alerte est générée lorsqu'un utilisateur subit **3 échecs de connexion en moins de 10 minutes**.

---

**Règle 3 — Connexion à une heure inhabituelle**

Une alerte est créée lorsqu'une connexion réussie est effectuée entre **00h00 et 05h00**.

Toutes ces alertes sont enregistrées automatiquement dans les Audit Logs avec l'attribut `is_suspicious = True`.

---

#### 5. Tableau de bord des journaux

Une API de statistiques permet d'alimenter le tableau de bord d'administration.

Les indicateurs disponibles sont notamment :

- nombre de connexions du jour ;
- nombre d'échecs de connexion ;
- nombre d'alertes de sécurité ;
- adresses IP les plus suspectes ;
- dernières alertes enregistrées.

---

### Fichiers concernés

| Fichier | Description |
|----------|-------------|
| `backend/logs_app/filters.py` | Implémente les filtres avancés permettant la recherche et le filtrage des journaux d'audit. |
| `backend/logs_app/serializers.py` | Contient `AuditLogSerializer` utilisé pour enrichir les informations retournées au frontend. |
| `backend/logs_app/views.py` | Implémente les APIs de consultation des logs, des statistiques, des audits et des anomalies. |
| `backend/logs_app/urls.py` | Définit les routes REST du module Audit & Logs. |
| `backend/users/views.py` | Intègre la logique de détection automatique des anomalies lors des connexions et des échecs de connexion. |
| `backend/config/urls.py` | Déclare les routes du module `logs_app` dans la configuration principale du projet. |

---

