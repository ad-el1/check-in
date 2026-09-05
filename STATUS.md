# État d'avancement — implémentation

Suivi des phases de `CHECKLIST.md`. ✅ fait dans le code · 🔧 action manuelle
requise (compte Supabase / Vercel) · ⏳ à valider en test réel.

## Phase 1 — Setup
- ✅ Next.js 14 + TS + Tailwind + ESLint
- ✅ shadcn/ui : button, input, card, table, dialog, badge, tabs, progress,
  label, skeleton, select, dropdown-menu, sonner
- ✅ Clients Supabase (`lib/supabase/client|server|admin|middleware`)
- ✅ `.env.local.example`
- 🔧 Projet Supabase à créer · repo GitHub à créer (branche `dev`)

## Phase 2 — Base de données
- ✅ `supabase/schema.sql` (tables, index, RLS, `get_user_role()`, vue
  `v_stats_by_day`, realtime `checkins`/`meals`)
- ✅ `supabase/seed.sql` (5 membres de test)
- 🔧 Exécuter les scripts dans le SQL Editor

## Phase 3 — Auth & rôles
- ✅ `middleware.ts` : garde par préfixe de route + redirections
- ✅ Layouts serveur avec double contrôle de rôle
- ✅ Page `/login` + `/unauthorized` + `/api/auth/signout`
- 🔧 Créer les 3 comptes + métadonnée `role` (`supabase/accounts.md`)

## Phase 4 — Flux QR
- ✅ `GET /api/qr` (génération + purge)
- ✅ `/checkin/qr-screen` : QR 400px, rotation 5 s, barre de progression,
  Wake Lock, compteur présents temps réel

## Phase 5 — Scan mobile
- ✅ `/scan` : lecture `?token=`, clavier numérique, validation CNE,
  `POST /api/checkin`, 4 états (succès / expiré / inconnu / déjà)
- ✅ Fenêtre de grâce (`QR_GRACE_SECONDS`) côté API
- ⏳ Test iPhone / Android réel

## Phase 6 — Présences
- ✅ `/checkin/presences` : table réactive (Supabase Realtime), compteur
  « X présents sur Y »

## Phase 7 — Restauration
- ✅ `/restauration/petit-dejeuner` + `/dejeuner` : liste des présents,
  recherche, bouton + modal de confirmation, compteur « X / Y servis »,
  onglets, realtime, annulation possible

## Phase 8 — Dashboard admin
- ✅ 4 KPI, 3 graphiques Recharts (arrivées/heure, présences/jour,
  repas/jour), table des absents + « Marquer présent », sélecteur J1→J7,
  export CSV, realtime

## Phase 9 — Gestion membres
- ✅ Table paginée + recherche, ajout (modal), import CSV (PapaParse,
  CNE normalisé), activation/désactivation, présence manuelle

## Phase 10 — PWA & polish
- ✅ `manifest.json` (couleurs FSSM), icônes 192/512 (aplats provisoires),
  `theme-color`, loading states (skeletons/spinners), messages d'erreur
- 🔧 Remplacer les icônes par le logo officiel

## Phase 11 — Déploiement
- 🔧 GitHub + Vercel + variables d'environnement

## Phase 12 — Tests finaux
- ⏳ Simulation journée complète une fois Supabase connecté
