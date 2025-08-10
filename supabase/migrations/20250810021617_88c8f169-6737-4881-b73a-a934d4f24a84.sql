-- Ajouter 5 signalements de test supplémentaires
WITH pops AS (
  SELECT array_agg(id ORDER BY created_at) AS ids FROM population
),
admin_test AS (
  SELECT id FROM admin WHERE username = 'test' AND status = 'active' LIMIT 1
)
INSERT INTO reports (
  type, description, status, priority, department, address, latitude, longitude, population_id, assigned_admin_id, created_at, updated_at
)
VALUES
  ('Voirie', 'Route dégradée nécessitant une intervention.', 'en-attente', 'high', 'Dakar', 'Grand Médine', 14.739, -17.458, (SELECT ids[1] FROM pops), (SELECT id FROM admin_test), now() - interval '2 hours', now() - interval '2 hours'),
  ('Déchets', 'Bac de collecte débordant.', 'en-cours', 'normal', 'Dakar', 'Sicap Baobab', 14.708, -17.467, (SELECT ids[2] FROM pops), (SELECT id FROM admin_test), now() - interval '5 hours', now() - interval '1 hours'),
  ('Éclairage', 'Plusieurs lampadaires éteints la nuit.', 'en-attente', 'low', 'Dakar', 'Camberène', 14.780, -17.423, (SELECT ids[3] FROM pops), (SELECT id FROM admin_test), now() - interval '1 day', now() - interval '12 hours'),
  ('Eau', 'Canalisation cassée créant une flaque.', 'resolu', 'urgent', 'Dakar', 'Ouest Foire', 14.740, -17.480, (SELECT ids[4] FROM pops), (SELECT id FROM admin_test), now() - interval '3 days', now() - interval '1 day'),
  ('Sécurité', 'Zone mal éclairée signalée par les riverains.', 'rejete', 'normal', 'Dakar', 'Sacré Cœur 3', 14.710, -17.470, (SELECT ids[5] FROM pops), (SELECT id FROM admin_test), now() - interval '12 hours', now() - interval '10 hours');

-- Index supplémentaires pour les filtres
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_department ON reports(department);