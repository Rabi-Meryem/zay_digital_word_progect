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
