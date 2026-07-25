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


1. Module SLA — Configuration des règles de service (Admin/Superviseur)

Objectif métier (CDC, Module 8.2 / 6.1) : permettre à l'administrateur (et au superviseur, selon la matrice CRUD du CDC) de configurer les délais de résolution maximaux et les seuils d'alerte pour chaque niveau de priorité (Critique, Haute, Moyenne, Basse), sans intervention technique.

Technologies : Django REST Framework (ViewSet + Router), React.js, Tailwind CSS.

Fichiers ajoutés (backend, app sla/) :


sla/serializers.py — sérialisation du modèle SLARule existant (délai, seuil d'alerte, priorité, actif).
sla/views.py — SLARuleViewSet (CRUD complet), avec gestion propre de la suppression protégée (un ticket ne peut pas perdre sa règle SLA).
sla/urls.py — expose /api/sla-rules/.


Fichiers modifiés :


config/urls.py — ajout de include('sla.urls').


Fichiers ajoutés (frontend) :


frontend/src/api/sla.js — appels API (liste, mise à jour).
frontend/src/pages/admin/sla-config/SlaConfigPage.jsx — interface d'édition des 4 règles SLA (délai, seuil d'alerte, statut actif), avec validation et retour visuel (toasts).


Justification : centraliser les délais SLA en base de données plutôt qu'en dur dans le code permet à l'administrateur de faire évoluer les engagements de service (Plan Essentiel/Standard/Premium) sans redéploiement, conformément au cahier des charges fonctionnel.


2. Module Escalades — Traitement par le superviseur

Objectif métier (CDC, Modules 6.4 / 5.5) : permettre au superviseur de recevoir, qualifier et traiter les escalades manuelles (agent → superviseur) ou automatiques (dépassement SLA).

Technologies : Django REST Framework (APIView), React.js.

Fichiers ajoutés (backend, app escalation/) :


escalation/serializers.py — sérialisation enrichie (infos client, ticket, agent à l'origine, deadline SLA).
escalation/views.py — 4 vues : liste des escalades (filtrable par statut), prise en charge, réaffectation à un autre agent, renvoi à l'agent d'origine.
escalation/urls.py — expose /api/escalations/.


Fichiers modifiés :


config/urls.py — ajout de include('escalation.urls').
tickets/services.py (ticket_service.escalate_ticket) — réutilisé tel quel pour la création d'escalade (aucune duplication de logique métier).


Justification : cette app existait déjà au niveau du modèle (Escalation) mais sans couche API — elle a été complétée pour rendre les données consultables et actionnables depuis le dashboard superviseur.


3. Dashboard Superviseur — Vue d'ensemble, Supervision SLA, Performance équipe

Objectif métier (CDC, Module 7 — Dashboard et Reporting) : donner au superviseur une vision globale et temps réel de l'activité du support (KPIs, volumes, répartition des statuts, conformité SLA, performance par agent).

Technologies : Django REST Framework (agrégations via l'ORM Django : Count, Avg), React.js, Recharts (graphiques), Tailwind CSS.

Fichiers ajoutés (backend, app tickets/) :


tickets/views_dashboard.py — 6 vues dédiées au superviseur :

SupervisorKpisView : indicateurs globaux (total, ouverts, en cours, résolus, critiques actifs, SLA non respecté, conformité SLA, satisfaction moyenne).
SupervisorVolumeView : volume de tickets créés/résolus sur 7 jours glissants.
SupervisorStatusDistributionView : répartition des tickets par statut.
SupervisorAiClassificationView : répartition des tickets par criticité prédite par l'IA (prêt pour le module IA à venir).
SupervisorSlaTicketsView : liste des tickets actifs triés par urgence SLA, avec filtres (dépassé / à risque).
SupervisorAgentsPerformanceView : statistiques par agent (tickets traités, temps moyen de résolution, taux de respect SLA, satisfaction, charge active).





Fichiers ajoutés (backend, app users/) :


users/views_agents.py — AgentListView (liste des agents avec disponibilité/charge) et AgentAvailabilityUpdateView (mise à jour du statut de disponibilité).
users/serializers.py — ajout de AgentAvailabilitySerializer.


Fichiers modifiés :


tickets/urls.py — ajout des 6 routes supervisor/....
users/urls.py — ajout des routes agents/....


Fichiers ajoutés (frontend) :


frontend/src/api/supervisor.js — centralise tous les appels API du dashboard superviseur.
frontend/src/utils/agentDisplay.js — génération déterministe de couleur/initiales par agent (évite de stocker ces informations en base).
frontend/src/pages/supervisor/SupervisorDashboardPage.jsx — branchement complet du dashboard (précédemment sur données de démonstration) sur les API réelles : Vue d'ensemble, Escalades, Supervision SLA, Performance équipe, Rapports, modale de réaffectation.


Justification : les indicateurs sont calculés à la volée depuis la table Ticket plutôt que stockés (sauf la charge agent, tenue à jour par ticket_service._update_agent_workload), ce qui garantit des chiffres toujours exacts sans job de synchronisation supplémentaire à maintenir à ce stade du projet.


4. Module Rapports — Export PDF / Excel / CSV

Objectif métier (CDC, Module 7.9 — Reporting et export) : permettre au superviseur de générer un rapport de performance filtré (période, agent, priorité, statut) et de le télécharger.

Technologies : ReportLab (génération PDF), openpyxl (génération Excel), module csv natif Python (export CSV), Django (FileField + stockage).

Fichiers ajoutés (backend, app reports/) :


reports/services.py — get_report_data(), fonction unique de collecte des données (KPIs, performance par agent, tickets escaladés) réutilisée par les 3 formats d'export.
reports/serializers.py — sérialisation de l'historique des rapports générés.
reports/views.py — GenerateReportView (génère et déclenche le téléchargement ; PDF et Excel sont aussi persistés dans la table Report conformément au modèle existant) et ReportListView (historique des rapports).
reports/urls.py — expose /api/reports/generate/ et /api/reports/.


Fichiers modifiés :


config/urls.py — ajout de include('reports.urls').


Fichiers ajoutés (frontend) :


frontend/src/api/reports.js — déclenche le téléchargement du fichier depuis le navigateur.
Section « Rapports » du SupervisorDashboardPage.jsx — filtres (agent, priorité, statut) et sélection du format d'export.


Justification : la génération est faite à la demande (pas de tâche planifiée) car c'est une action explicite du superviseur ; les rapports PDF/Excel sont conservés en base (Report) pour permettre un historique consultable, conformément aux deux modèles déjà définis dans le projet (Report, AgentStatistics).


5. Module Notifications — Alertes in-app et email

Objectif métier (CDC, Module 5 — Notifications) : informer automatiquement chaque utilisateur des événements qui le concernent (création de ticket, affectation, changement de statut, résolution, réouverture, escalade, alerte SLA, surcharge agent, alerte sécurité), via notification in-app et email.

Technologies : Django (templates HTML pour les emails, déjà existants), service de notification centralisé.

Fichiers ajoutés (backend, app notifications/) :


notifications/serializers.py — sérialisation des notifications (type, titre, contenu, lu/non lu, ticket associé).
notifications/views.py — NotificationListView (liste paginée, filtrable par lu/non lu), NotificationMarkReadView, NotificationMarkAllReadView, NotificationUnreadCountView (pour le badge de la cloche).
notifications/urls.py — expose /api/notifications/....
sla/management/commands/check_sla.py — commande de vérification périodique des seuils SLA (80 % → alerte préventive de l'agent ; 100 % → alerte critique + escalade automatique), prérequis pour que les notifications SLA_WARNING/SLA_EXCEEDED se déclenchent réellement.


Fichiers modifiés :


config/urls.py — ajout de include('notifications.urls').
notifications/services.py — extension de NotificationService.notify() avec des paramètres optionnels (override_title, override_content) pour permettre des messages différenciés selon le destinataire (ex. agent vs client sur un même événement d'affectation) et la prise en charge d'alertes sans ticket associé (surcharge agent, alerte sécurité) ; rétrocompatible avec tous les appels existants.
tickets/services.py (TicketService) — ajout des appels à notification_service.notify(...) aux points clés du cycle de vie d'un ticket : création (client + superviseurs), affectation (agent + client), changement de statut (résolu, clôturé, réouvert, autres), escalade (superviseur), surcharge agent (superviseurs).
users/views.py — ajout d'un envoi de notification réelle aux administrateurs lors de la détection d'anomalies de connexion (au lieu du seul enregistrement en AuditLog) : force brute par IP, tentatives répétées sur un compte, connexion à horaire inhabituel.


Justification : le service de notification existait déjà mais n'était appelé nulle part dans le code métier — ce lot connecte effectivement chaque événement du cycle de vie d'un ticket (et de la sécurité des comptes) à l'envoi réel d'une notification, conformément aux modules 5.2 à 5.6 du cahier des charges fonctionnel.