# Audit de la base de données — EasyQual

**Projet Supabase :** `gxworwhpcyfuqwuxocxx` (PostgreSQL 17.6, région eu-west-1)
**Date :** 2026-06-30
**Périmètre :** schéma versionné (`supabase/schema.sql`) + 60+ migrations (`supabase/migrations/`) + fonctions Edge + scripts utilitaires.
**Méthode :** analyse statique de la définition de schéma, des policies RLS, des fonctions `SECURITY DEFINER`, des `GRANT`, des index et de l'hygiène des migrations. (Pas d'introspection live : aucun mot de passe Postgres direct n'est disponible, seulement les clés API.)

---

## 1. Vue d'ensemble

**Tables principales (≈18) :** `profiles`, `credits_wallet`, `transactions`, `tenants`, `cases`, `criteria`, `indicators`, `sessions`, `evidences`, `reviews`, `logs`, `case_indicator_states`, `case_messages`, `case_events`, `case_notifications`, `admin_notifications`, `consultant_resources`, `criterion_quiz_uploads`, `questionnaires_results`, `reclamations`, `system_settings`.

**Modèle de rôles :** `admin` / `consultant` / `of` (client = Organisme de Formation). Multi-tenant : un consultant crée des `tenants`, chaque tenant a un `owner_id` (le compte client). L'isolation repose **entièrement sur le RLS**.

**Constat général :** le modèle relationnel est cohérent et bien pensé (FK, `on delete cascade`, fonction transactionnelle `create_case_and_debit` avec verrou `FOR UPDATE`). En revanche, **la couche sécurité (RLS + GRANT + gestion des mots de passe) présente plusieurs failles graves**, et l'historique de migrations montre une forte instabilité du RLS (réécrit ~15 fois).

---

## 2. 🔴 Failles CRITIQUES (à corriger en priorité)

### C1 — `add_credits` exécutable par `anon` = fraude aux crédits
Fichier : `migrations/20260226_fix_credits_and_grants.sql`
```sql
CREATE FUNCTION public.add_credits(p_consultant_id uuid, p_amount int)
  ... SECURITY DEFINER ...   -- aucun contrôle d'autorisation interne
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, int) TO anon;       -- ⚠️
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, int) TO authenticated;
```
La fonction est `SECURITY DEFINER` (bypass RLS, s'exécute en `postgres`), **ne vérifie aucune identité ni rôle**, et est accordée à `anon`. La clé `anon` étant publiée dans le bundle JS frontend, **n'importe qui** peut appeler :
```js
supabase.rpc('add_credits', { p_consultant_id: '<uuid>', p_amount: 999999 })
```
→ créditer gratuitement un portefeuille à l'infini, en contournant tout paiement. **Impact : financier direct.**
**Correctif :** révoquer `anon` ; déplacer la recharge dans une Edge Function authentifiée déclenchée par le webhook du prestataire de paiement ; ajouter un contrôle de rôle interne.

### C2 — `create_case_and_debit` exécutable par `anon`
Fichiers : plusieurs migrations (`GRANT EXECUTE ... TO anon`). Même problème : un appelant non authentifié peut déclencher des débits/créations de dossiers sur n'importe quel `consultant_id`. **Correctif :** `REVOKE ... FROM anon`, vérifier `auth.uid() = p_consultant_id` à l'intérieur de la fonction.

### C3 — Autorisation basée sur `user_metadata` (auto-promotion en admin)
Toutes les policies « admin » utilisent :
```sql
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' )
```
`user_metadata` (= `raw_user_meta_data`) est **modifiable par l'utilisateur lui-même** via `supabase.auth.updateUser({ data: { role: 'admin' } })`. Un client `of` peut donc se promouvoir admin et, au rafraîchissement du token, **lire toutes les policies « Admins view all »** : tous les tenants, dossiers, portefeuilles, transactions, profils de tous les clients. **Fuite de confidentialité massive + élévation de privilèges.**
**Correctif :** ne jamais utiliser `user_metadata` pour l'autorisation. Utiliser `app_metadata` (non modifiable par l'utilisateur) ou, mieux, vérifier le rôle via la table `profiles` (`exists (select 1 from profiles where id = auth.uid() and role = 'admin')`).
> À confirmer : que le rôle réel transite bien par `user_metadata` et non `app_metadata` — mais le pattern RLS lui-même est à proscrire.

### C4 — Mots de passe clients stockés en clair
- `tenants.initial_password` (`migrations/20260302_add_client_credentials.sql`)
- `profiles.temp_password` (`migrations/20260210_add_temp_password.sql`)

Des mots de passe en clair sont écrits en base et lus par les scripts (`fix-client-password.mjs`, `fix-password.js`). C'est une violation RGPD/sécurité : un accès en lecture (cf. C3) expose des identifiants réutilisables.
**Correctif :** supprimer ces colonnes ; s'appuyer uniquement sur `auth.users.encrypted_password` (bcrypt) ; pour le provisioning, générer un mot de passe à usage unique transmis hors-bande et jamais persisté en clair.

### C5 — Clé `service_role` en clair dans le dépôt Git
`fix-password.js` (et autres) contiennent en dur :
```js
const SUPABASE_SERVICE_ROLE_KEY = 'eyJ...service_role...'  // bypass total du RLS
```
La clé `service_role` contourne tout le RLS. Présente dans des fichiers versionnés, elle est compromise dès que le repo est partagé/poussé.
**Correctif immédiat :** **révoquer/roter la clé service_role** dans le dashboard Supabase ; déplacer toutes les clés vers des variables d'environnement non versionnées ; purger l'historique Git (`git filter-repo`) ; vérifier que `.gitignore` couvre `.env*`.

---

## 3. 🟠 Problèmes MAJEURS — RLS & accès

| # | Problème | Détail |
|---|----------|--------|
| M1 | **Policy admin cassée dans `schema.sql`** | Lignes 260-262 : un `using(...)` orphelin sans `create policy ... for select` → erreur SQL si rejoué. `schema.sql` n'est plus une source fiable. |
| M2 | **Instabilité chronique du RLS** | ~15 migrations `*_fix_rls_*` / `*_fix_*_rls_*` (récursion, `permission denied for table auth.users`, isolation client, messages). Signe que les policies ont été corrigées à chaud sans modèle d'autorisation centralisé. |
| M3 | **`GRANT ALL ... TO authenticated`** | Sur `cases`, `tenants`, `case_messages`, `case_indicator_states`, `criterion_quiz_uploads`. Tout repose sur la justesse du RLS : la moindre faille de policy (cf. M2/C3) expose ou laisse modifier des données cross-tenant. Restreindre aux verbes réellement nécessaires. |
| M4 | **`get_auth_user_id(email)` ouvert** | `SECURITY DEFINER` qui lit `auth.users` ; « accessible to authenticated users ». Permet l'énumération d'emââils → existence de comptes. Restreindre l'exécution et/ou éviter d'exposer `auth.users`. |
| M5 | **Couverture INSERT/UPDATE/DELETE incomplète** | Plusieurs tables ont des policies `for select` mais l'écriture passe par `GRANT` + policies `for all` hétérogènes. À cartographier table par table pour garantir qu'aucune écriture cross-tenant n'est possible. |

---

## 4. 🟡 Schéma & intégrité des données

- **Enum `transaction_type` incomplet** : défini `('purchase','adjustment','usage')` mais `add_credits` insère `'recharge'` → échec si la colonne est typée enum, ou incohérence si castée en `text`. À aligner.
- **Indicateurs Qualiopi factices** : `schema.sql` insère `'Indicateur 1' … 'Indicateur 32'` avec un mapping critère « rough » (commentaire « placeholder »). À remplacer par les libellés/exigences réels du référentiel Qualiopi (32 indicateurs officiels).
- **Churn de type sur `audit_type`** : `text` → `text[]` → re-`text[]` sur plusieurs migrations le même jour (`20260212`, `20260219`). Risque d'incohérence selon l'état réellement appliqué en prod. À vérifier en live.
- **Doublons SIRET** : deux migrations `fix_duplicate_siret` → des doublons existaient malgré la contrainte `unique`. Vérifier que la contrainte est bien active et qu'aucune donnée résiduelle ne subsiste.
- **`tenants.siret unique` mais nullable** : plusieurs `NULL` autorisés (OK en SQL), mais valider la règle métier.

---

## 5. 🟢 Performance & index

**Points positifs :** `migrations/20260626_add_performance_indexes.sql` ajoute les index FK les plus utiles (`cases.tenant_id`, `cases.consultant_id`, `tenants.created_by`, `tenants.owner_id`, `tenants.client_email`, `case_*`).

**Index FK manquants probables** (FK sans index → scans séquentiels + lenteur sous RLS qui filtre par ces colonnes) :
- `evidences.case_id`, `evidences.indicator_id`, `evidences.session_id`, `evidences.uploaded_by`
- `reviews.case_id`, `reviews.indicator_id`, `reviews.reviewer_id`
- `transactions.wallet_id`
- `sessions.tenant_id`
- `logs.user_id`

Les policies RLS exécutent des `EXISTS (SELECT 1 FROM tenants/cases ...)` **à chaque ligne** : sans index sur les colonnes de jointure, le coût explose à volume. Indexer toutes les colonnes FK référencées dans les policies.

---

## 6. Hygiène des migrations / DevOps

- **`schema.sql` désynchronisé** : ne reflète ni les nouvelles tables (reclamations, questionnaires, notifications…), ni les colonnes ajoutées, et contient une policy cassée (M1). Régénérer un dump propre via `supabase db dump` comme source de vérité unique.
- **Volume de correctifs** : ~40 % des migrations sont des `fix_*`. Recommandation : figer un modèle d'autorisation (helper `is_admin()`, `is_consultant_of(tenant)`, `is_owner_of(tenant)` en fonctions `STABLE`) et réécrire les policies par-dessus, plutôt que de patcher.
- **Scripts de debug/réparation versionnés** (`debug_*.js`, `repair_*.js`, `fix-*.js`) contenant clés et mots de passe : à sortir du dépôt.

---

## 7. Plan d'action priorisé

**Immédiat (sécurité, < 24 h)**
1. Roter la clé `service_role` (C5) et purger l'historique Git.
2. `REVOKE EXECUTE ON FUNCTION add_credits, create_case_and_debit FROM anon;` (C1, C2).
3. Remplacer toutes les policies `user_metadata ->> 'role'` par un contrôle via `profiles`/`app_metadata` (C3).

**Court terme (1-2 semaines)**
4. Supprimer `initial_password` / `temp_password`, refonte du provisioning (C4).
5. Ajouter contrôle d'autorisation interne dans les fonctions `SECURITY DEFINER`.
6. Cartographier et compléter les policies INSERT/UPDATE/DELETE (M5), restreindre les `GRANT ALL` (M3).

**Moyen terme**
7. Régénérer `schema.sql`, centraliser le modèle RLS via fonctions helper.
8. Ajouter les index FK manquants (§5).
9. Corriger l'enum `transaction_type` et injecter les vrais indicateurs Qualiopi.

---

*Audit statique. Une vérification live (état réel des policies, des index, des données orphelines, doublons SIRET) est recommandée en complément — réalisable via `supabase db dump` ou un accès Postgres direct.*
