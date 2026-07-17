# EasyQual - Plateforme de Gestion Qualiopi

EasyQual est une solution SaaS (Software as a Service) conçue pour digitaliser et simplifier la préparation et le suivi des audits de certification Qualiopi. La plateforme met en relation les consultants qualité et les organismes de formation, offrant un espace collaboratif pour l'auto-évaluation, la collecte de preuves et le pilotage de la conformité.

## 🚀 Fonctionnalités Clés

*   **Tableau de Bord Consultant :** Suivi global de l'activité, gestion des clients, et indicateurs de performance.
*   **Tableau de Bord Client :** Espace dédié pour déposer les preuves et suivre l'avancement de l'audit.
*   **Gestion des Audits :** Support complet pour les audits Initiaux, de Surveillance et de Renouvellement.
*   **Collaboration en Temps Réel :** Échanges directs entre consultants et clients sur chaque indicateur.
*   **Multi-référentiels :** Adapté aux différentes catégories d'actions (Formation, Bilan de Compétences, VAE, Apprentissage).

## 🛠️ Stack Technologique

Le projet est construit avec une architecture moderne, performante et maintenable :

### Frontend (Interface Utilisateur)
*   **Core :** [React](https://react.dev/) v19 - Bibliothèque JavaScript pour construire les interfaces utilisateurs.
*   **Build Tool :** [Vite](https://vitejs.dev/) - Outil de build ultra-rapide pour le développement moderne.
*   **Langage :** JavaScript (ES Modules).
*   **Apparence & Styles :** [Tailwind CSS](https://tailwindcss.com/) v4 - Framework CSS utilitaire pour un design rapide et personnalisé.
*   **Routing :** [React Router DOM](https://reactrouter.com/) v7 - Gestion de la navigation côté client (SPA).
*   **Icônes :** [Lucide React](https://lucide.dev/) - Bibliothèque d'icônes SVG légère et cohérente.
*   **Visualisation de Données :** [Recharts](https://recharts.org/) - Composants de graphiques pour React.

### Backend & Infrastructure (BaaS)
*   **Plateforme :** [Supabase](https://supabase.com/) - Alternative open-source à Firebase.
*   **Base de Données :** PostgreSQL - Base de données relationnelle robuste et SQL-compliant.
*   **Authentification :** Supabase Auth - Gestion sécurisée des utilisateurs et des sessions (Email/Password).
*   **Sécurité des Données :** Row Level Security (RLS) - Contrôle d'accès granulaire au niveau des lignes de la base de données.
*   **Stockage :** Supabase Storage - Gestion des fichiers (logos, documents de preuve).
*   **Fonctions Serverless :** Supabase Edge Functions - Exécution de code backend à la demande (ex: envoi d'emails transactionnels).

## 🏗️ Architecture

L'application repose sur une architecture **Single Page Application (SPA)** couplée à une infrastructure **Serverless** :

1.  **Côté Client (Browser) :** L'interface React gère toute l'interaction utilisateur, le rendu des pages et la logique de présentation. Elle communique directement avec les APIs de Supabase.
    
2.  **API & Base de Données (Cloud) :**
    *   Supabase expose automatiquement une API RESTful sécurisée au-dessus de la base PostgreSQL.
    *   Les règles de sécurité (Policies) sont définies directement dans la base de données (RLS), garantissant que chaque utilisateur ne peut accéder qu'à ses propres données, quel que soit le point d'entrée.

3.  **Authentication & Sessions :** Le système gère les jetons JWT (JSON Web Tokens) pour maintenir les sessions utilisateurs sécurisées et propager l'identité de l'utilisateur jusqu'à la base de données pour l'application des règles RLS.

## 📦 Installation et Démarrage

1.  Installer les dépendances :
    ```bash
    npm install
    ```

2.  Lancer le serveur de développement :
    ```bash
    npm run dev
    ```

3.  Ouvrir le navigateur à l'adresse indiquée (par défaut `http://localhost:5173`).

---

## 📁 Organisation du Code Source

Voici l'organisation détaillée de l'arborescence des fichiers du projet :

```
Easy_Qual/
├── docs/                               # Documentation, audits et schémas SQL
│   ├── AUDIT_BASE_DE_DONNEES.md        # Audit complet de la base de données
│   ├── Audit_Base_de_Donnees_EasyQual.pdf # Rapport d'audit au format PDF
│   ├── qualiopi_audit_schema.sql       # Script SQL des structures de tables d'audit
│   ├── public_schema_dump.sql          # Dump SQL de la structure publique
│   └── fix_reclamations_delete.sql     # Correction SQL pour la suppression de réclamations
├── public/                             # Fichiers statiques copiés à la racine lors du build
│   └── assets/                         # Logos, médias et icônes
├── src/                                # Code source React principal de l'application
│   ├── components/                     # Composants réutilisables (tableaux, modals, cartes)
│   ├── pages/                          # Pages de l'application (Dashboard, Clients, Login)
│   ├── lib/                            # Outils et configuration du client Supabase
│   ├── App.jsx                         # Composant racine React et gestion du routage
│   └── main.jsx                        # Point d'entrée de l'application React
├── scratch/                            # Scripts de maintenance, de synchronisation et de test
│   ├── check_cols.js
│   ├── debug_db.js
│   ├── debug_notifs.js
│   ├── debug_tenants.mjs
│   ├── deploy_log.txt
│   ├── fix-client-password.mjs
│   ├── fix-password.js
│   ├── inspect_db.mjs
│   ├── lint_results.txt
│   ├── list_notifs.js
│   ├── repair_result.json
│   ├── repair_result_final.json
│   ├── repair_users.js
│   ├── repair_users.mjs
│   ├── run_global_repair.mjs
│   ├── sync_all_clients.mjs
│   ├── test-invite.js
│   ├── test-invite2.mjs
│   └── test-req.js
├── supabase/                           # Configuration de base de données (fonctions, migrations)
├── index.html                          # Fichier d'entrée de l'application
├── package.json                        # Liste des dépendances et scripts npm
├── vite.config.js                      # Configuration du build Vite
├── PASSATION.md                        # Fichier de passation résumant l'état du projet
└── README.md                           # Ce fichier d'introduction
```

