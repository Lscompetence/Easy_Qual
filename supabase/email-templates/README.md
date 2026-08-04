# Templates d'emails Supabase Auth

Ces templates concernent les emails envoyés **directement par Supabase Auth**
(réinitialisation de mot de passe, confirmation d'inscription). Ils ne passent pas
par le code de l'application : ils sont stockés côté Supabase et doivent être
collés manuellement dans le dashboard.

⚠️ À ne pas confondre avec les emails Brevo (« Vos accès Consultant/Client »),
dont le HTML se trouve dans `supabase/functions/*/index.ts` et se déploie avec
`npx supabase functions deploy`.

## Installation d'un template

1. Ouvrir https://supabase.com/dashboard/project/gxworwhpcyfuqwuxocxx/auth/templates
2. Sélectionner le template concerné (ex. « Reset Password »)
3. Renseigner le sujet en français, par exemple :
   `Réinitialisation de votre mot de passe Easy'Qual`
4. Coller le contenu du fichier `.html` correspondant dans le champ « Message body »
5. Enregistrer

| Fichier | Template Supabase | Sujet suggéré |
|---|---|---|
| `reset-password.html` | Reset Password | Réinitialisation de votre mot de passe Easy'Qual |

## ⚠️ SMTP personnalisé — indispensable avant la mise en production

Par défaut, Supabase envoie ces emails via son propre service (`mail.app.supabase.io`).
Ce service est prévu pour le développement uniquement et impose un quota très bas
(quelques emails par heure, partagés pour tout le projet). Une fois le quota atteint,
l'API renvoie `429 Too Many Requests` et **plus aucun email de réinitialisation
n'est envoyé**, quel que soit l'utilisateur qui le demande.

Le projet dispose déjà d'un compte Brevo (utilisé par les fonctions
`invite-client` et `admin_create_consultant`). Il faut le déclarer aussi comme
serveur SMTP de Supabase Auth :

1. Ouvrir https://supabase.com/dashboard/project/gxworwhpcyfuqwuxocxx/settings/auth
2. Section « SMTP Settings » → activer « Enable Custom SMTP »
3. Renseigner les paramètres SMTP Brevo :

   | Champ | Valeur |
   |---|---|
   | Host | `smtp-relay.brevo.com` |
   | Port | `587` |
   | Username | l'identifiant SMTP du compte Brevo |
   | Password | la clé SMTP Brevo (à générer dans Brevo > SMTP & API) |
   | Sender email | `devweb.lsc@outlook.com` (ou l'expéditeur vérifié) |
   | Sender name | `EasyQual` |

4. Enregistrer, puis retester « Mot de passe oublié »

Tant que cette configuration n'est pas faite, la fonctionnalité « mot de passe
oublié » reste inutilisable pour les clients finaux.

## URLs de redirection à autoriser

Sans cette configuration, le lien reçu par email renvoie vers l'URL par défaut du
site (et non vers `/update-password`), ce qui provoque l'erreur
« Email link is invalid or has expired ».

Dans https://supabase.com/dashboard/project/gxworwhpcyfuqwuxocxx/auth/url-configuration,
ajouter dans « Redirect URLs » :

```
https://easy-qual.fr/**
https://easy-qual.vercel.app/**
http://localhost:5173/**
http://localhost:5188/**
```

Les deux entrées `localhost` servent au développement et aux tests E2E ; elles
peuvent être retirées pour une configuration de production stricte.
