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
