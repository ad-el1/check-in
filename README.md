# FSSM Check-in 2026-2027

Application de check-in du comité d'organisation de la rentrée universitaire
2026-2027 — Faculté des Sciences Semlalia, Université Cadi Ayyad, Marrakech.

Gère, sur 7 jours (J1→J7) :

- le **check-in** des membres via QR code rotatif ;
- la **distribution des repas** (petit-déjeuner + déjeuner) ;
- un **dashboard admin** temps réel (stats, absents, export CSV) ;
- la **gestion des membres** (CRUD + import CSV) et des **comptes**.

## Stack

Next.js 14 (App Router, TS) · shadcn/ui + Tailwind · Supabase (Postgres +
Realtime + Auth) · Recharts · qrcode.react · PWA · déploiement Vercel.

## Mise en route

### 1. Dépendances

```bash
npm install
```

### 2. Supabase

1. Créer un projet sur [supabase.com](https://supabase.com).
2. **SQL Editor** → exécuter `supabase/schema.sql` (tables, RLS, vues, realtime).
3. (Optionnel) exécuter `supabase/seed.sql` pour 5 membres de test.
4. Créer les 3 comptes Auth + métadonnée `role` : voir `supabase/accounts.md`.
5. Réglages → API : récupérer l'URL, la clé `anon` et la clé `service_role`.

### 3. Variables d'environnement

Copier `.env.local.example` → `.env.local` et remplir :

| Variable | Rôle |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé publique |
| `SUPABASE_SERVICE_ROLE_KEY` | clé serveur (routes API — **jamais exposée**) |
| `NEXT_PUBLIC_APP_URL` | URL publique (encodée dans le QR) |
| `NEXT_PUBLIC_EVENT_START_DATE` | date de J1 (`YYYY-MM-DD`) — sert au calcul du jour courant |
| `QR_ROTATION_SECONDS` | rafraîchissement du QR (défaut 5) |
| `QR_GRACE_SECONDS` | fenêtre de grâce après expiration (défaut 10) |
| `QR_TTL_SECONDS` | durée de vie d'un token (défaut 15) |

### 4. Lancer

```bash
npm run dev      # http://localhost:3000
```

## Rôles & routes

| Rôle | Accès |
|------|-------|
| `admin` | tout (`/admin/*`, `/checkin/*`, `/restauration/*`) |
| `checkin` | `/checkin/qr-screen`, `/checkin/presences` |
| `restauration` | `/restauration/petit-dejeuner`, `/restauration/dejeuner` |
| public | `/scan` (membres, sans connexion) |

Le calcul du **jour courant** (J1→J7) se fait à partir de
`NEXT_PUBLIC_EVENT_START_DATE`. Le dashboard admin permet de naviguer
manuellement entre les jours.

## API

| Route | Méthode | Rôle | Description |
|-------|---------|------|-------------|
| `/api/qr` | GET | public | génère un token, purge les expirés |
| `/api/checkin` | POST | public | `{ token, cne }` → présence QR |
| `/api/checkin/manual` | POST | admin | `{ member_id, day? }` → présence manuelle |
| `/api/meals` | POST | resto/admin | `{ member_id, day?, meal_type, value? }` |
| `/api/members` | GET/POST | admin | liste / création / import `{ rows: [] }` |
| `/api/members/:id` | PATCH | admin | modif / activation |
| `/api/stats` | GET | admin | agrégats dashboard |
| `/api/accounts` · `/api/accounts/reset` | GET · POST | admin | comptes / reset mot de passe |
| `/api/export` | GET | admin | export CSV de la présence |
| `/api/auth/signout` | POST | — | déconnexion |

Les écritures publiques (scan, QR) passent par les routes API avec la clé
`service_role` : la RLS ne définit que l'accès des 3 comptes authentifiés.

## Déploiement Vercel

1. Pousser la branche sur GitHub.
2. Importer le repo sur Vercel, framework **Next.js** détecté.
3. Ajouter les mêmes variables d'environnement (avec
   `NEXT_PUBLIC_APP_URL` = URL de production).
4. Déployer. Le QR de `/checkin/qr-screen` encode `NEXT_PUBLIC_APP_URL/scan?token=…`.

## Notes

- **Git** : travailler sur la branche `dev`, ne pas pousser sur `main`.
- Les icônes PWA (`public/icons/*`) sont des aplats verts provisoires —
  remplacer par le logo officiel FSSM avant l'événement.
