# 📝 Document de Passation — Easy'Qual

Ce document résume l'architecture du projet, l'organisation des répertoires, les scripts de maintenance et les points de vigilance.

---

## 🏗️ Structure du Projet

Les scripts de diagnostic, tests et corrections ont été déplacés dans `/scratch/` pour garder la racine claire. Les rapports d'audit et scripts de schémas SQL ont été déplacés sous `/docs/`.

```
Easy_Qual/
├── docs/                               # Documentation, audits et schémas SQL
│   ├── AUDIT_BASE_DE_DONNEES.md        # Audit complet de la base de données
│   ├── Audit_Base_de_Donnees_EasyQual.pdf # Version PDF de l'audit
│   ├── qualiopi_audit_schema.sql       # Schéma SQL pour l'audit Qualiopi
│   ├── public_schema_dump.sql          # Dump du schéma public de base
│   └── fix_reclamations_delete.sql     # Script SQL de correction pour les réclamations
├── public/                             # Fichiers statiques publics
├── scratch/                            # Scripts de débogage, réparation et tests
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
├── src/                                # Code source de l'application
├── supabase/                           # Configuration Supabase (migrations & fonctions)
├── index.html                          # Fichier d'entrée HTML
├── package.json                        # Dépendances et commandes npm
├── vite.config.js                      # Configuration du build Vite
└── PASSATION.md                        # Ce fichier de passation
```

---

## ⚡ État et Maintenance

* **Base de données :** Tous les scripts de réparation de base de données et de synchronisation des comptes utilisateurs se trouvent dans `/scratch/`.
* **Exécution locale :** Exécutez `npm run dev` pour démarrer le serveur de développement.
* **Compilation production :** Exécutez `npm run build` pour générer le dossier de production `/dist`.
