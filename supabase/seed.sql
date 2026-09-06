-- Données de test — à exécuter APRÈS schema.sql (optionnel).
insert into members (cne, nom, prenom) values
  ('R123456789', 'EL WARARI', 'Adham'),
  ('R234567890', 'BENALI',    'Sara'),
  ('R345678901', 'CHADI',     'Youssef'),
  ('R456789012', 'MANSOURI',  'Fatima'),
  ('R567890123', 'OUALI',     'Mehdi')
on conflict (cne) do nothing;
