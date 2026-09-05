-- Données de test — à exécuter APRÈS schema.sql (optionnel).
insert into members (cne, nom, prenom, filiere) values
  ('R123456789', 'EL WARARI', 'Adham',   'Informatique'),
  ('R234567890', 'BENALI',    'Sara',    'Mathématiques'),
  ('R345678901', 'CHADI',     'Youssef', 'Informatique'),
  ('R456789012', 'MANSOURI',  'Fatima',  'Physique'),
  ('R567890123', 'OUALI',     'Mehdi',   'Chimie')
on conflict (cne) do nothing;
