# Création des 3 comptes Supabase Auth

Dans **Supabase Dashboard → Authentication → Users → Add user** (cocher
« Auto Confirm User »), créer :

| Email                 | Rôle           |
|-----------------------|----------------|
| `admin@fssm.ma`       | `admin`        |
| `checkin@fssm.ma`     | `checkin`      |
| `restauration@fssm.ma`| `restauration` |

Puis pour **chaque** utilisateur, définir la métadonnée de rôle.

### Option A — SQL Editor (le plus simple)

```sql
update auth.users
set raw_user_meta_data =
  coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
where email = 'admin@fssm.ma';

update auth.users
set raw_user_meta_data =
  coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'checkin')
where email = 'checkin@fssm.ma';

update auth.users
set raw_user_meta_data =
  coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'restauration')
where email = 'restauration@fssm.ma';
```

### Option B — à la création via l'API admin

`User Metadata` (raw_user_meta_data) :

```json
{ "role": "admin" }
```

> Le rôle est lu par `get_user_role()` (RLS) et par le middleware Next.js
> via `user.user_metadata.role`. Après modification du rôle, l'utilisateur
> doit se reconnecter pour rafraîchir son JWT.
