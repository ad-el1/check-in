# Déploiement sur Railway

Le projet est configuré pour Railway (Nixpacks) :

| Fichier | Rôle |
|---|---|
| `railway.json` | builder Nixpacks, `startCommand`, healthcheck `/api/health`, restart policy |
| `nixpacks.toml` | Node 22, `npm ci` → `npm run build` → `npm run start` |
| `.nvmrc` | version Node (22) |
| `app/api/health/route.ts` | endpoint healthcheck (200) |
| `package.json` | `start` = `next start -H 0.0.0.0` (Railway injecte `PORT`) |

## Étapes sur railway.app

### 1. Créer le projet
1. [railway.app](https://railway.app) → se connecter avec **GitHub**.
2. **New Project** → **Deploy from GitHub repo** → autoriser Railway sur le repo
   `ad-el1/check-in` → le sélectionner.
3. Railway détecte `railway.json` + `nixpacks.toml` et lance un premier build.
   (Il échouera ou tournera à vide tant que les variables ne sont pas mises —
   c'est normal, on les ajoute à l'étape 2.)

### 2. Variables d'environnement
Onglet **Variables** du service → **New Variable** (ou *Raw Editor* pour tout
coller d'un coup) :

```
NEXT_PUBLIC_SUPABASE_URL=https://zmchcwrgvkshhzodjjvn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_zZnRaQaQFyhyRFi7XnB54g_7_KAk517
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....
NEXT_PUBLIC_EVENT_START_DATE=2026-09-07
QR_ROTATION_SECONDS=5
QR_TTL_SECONDS=120
QR_GRACE_SECONDS=30
SCREEN_KEY=une-longue-chaine-aleatoire-secrete
```

- `QR_TTL_SECONDS` + `QR_GRACE_SECONDS` = durée de validité d'un token
  (ici 150 s). Doit laisser le temps de scanner **et** de taper le CNE.
  Trop court → « QR code expiré » alors que le code vient d'être scanné.

- `SCREEN_KEY` = **mot de passe de l'écran public `/ecran`**. Mets une chaîne
  longue et aléatoire. Sans elle, `/ecran` refuse d'afficher le QR (sécurité).

- **Ne pas** définir `PORT` : Railway l'injecte automatiquement.
- `NEXT_PUBLIC_APP_URL` : on l'ajoute à l'étape 4 (il faut d'abord le domaine).
- Les `NEXT_PUBLIC_*` sont **injectées au build** par Nixpacks — toute
  modification impose un **redeploy**.

### 3. Générer le domaine
Onglet **Settings** → section **Networking** → **Generate Domain**.
→ tu obtiens `https://check-in-production-xxxx.up.railway.app`.

### 4. Finaliser `NEXT_PUBLIC_APP_URL` et redéployer
1. **Variables** → ajouter :
   ```
   NEXT_PUBLIC_APP_URL=https://check-in-production-xxxx.up.railway.app
   ```
   ⚠️ **Racine du domaine uniquement** — pas de `/login`, pas de `/` final.
   (Cette variable n'est qu'un repli : le QR encode de toute façon l'origine
   réelle du navigateur qui affiche l'écran kiosque.)
2. **Deployments** → dernier déploiement → **⋮** → **Redeploy**.

### 5. Branche déployée
**Settings** → **Source** → **Branch** : choisir `main` (ou `dev`).
Chaque push sur cette branche redéclenche un déploiement.

### 6. (Optionnel) Supabase Auth
Password auth ne nécessite pas de redirect URL. Si tu ajoutes plus tard des
magic links / OAuth : Supabase → **Authentication → URL Configuration** →
ajouter le domaine Railway dans *Site URL* et *Redirect URLs*.

## Vérifier

- `https://<domaine>/api/health` → `{"ok":true}`
- `https://<domaine>/login` → page de connexion
- `https://<domaine>/checkin/qr-screen` (connecté `checkin`/`admin`) → le QR
  encode `https://<domaine>/scan?token=...`

## Coût

Railway : plan **Hobby** (~5 $/mois de crédit inclus). Une petite app Next.js
comme celle-ci reste dans l'enveloppe.
