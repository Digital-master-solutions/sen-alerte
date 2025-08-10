-- 1) Purge des anciennes données (en conservant uniquement nos comptes admin/superadmin connus)
DELETE FROM notifications;
DELETE FROM report_assignments;
DELETE FROM messagerie;
DELETE FROM admin_notifications;
DELETE FROM reports;
DELETE FROM population;
DELETE FROM organizations;
TRUNCATE dashboard_stats;

-- 2) Données de test: Organisations
INSERT INTO organizations (name, type, email, phone, city, address, status, is_active, approved_at)
VALUES 
  ('Mairie Centre', 'public', 'contact@mairie-centre.sn', '+221700000001', 'Dakar', 'Plateau, Dakar', 'approved', true, now()),
  ('Propreté Urbaine', 'public', 'support@proprete.sn', '+221700000002', 'Dakar', 'Hann Bel-Air', 'approved', true, now()),
  ('Eaux & Assainissement', 'public', 'eau@assainissement.sn', '+221700000003', 'Dakar', 'Liberté 6', 'approved', true, now());

-- 3) Données de test: Population (utilisateurs citoyens)
WITH new_pop AS (
  INSERT INTO population (name, status)
  VALUES 
    ('Jean Ndiaye', 'active'),
    ('Aicha Diop', 'active'),
    ('Mamadou Sow', 'active'),
    ('Fatou Sarr', 'active'),
    ('Khadim Ba', 'active')
  RETURNING id
),
admin_test AS (
  SELECT id FROM admin WHERE username = 'test' AND status = 'active' LIMIT 1
)
-- 4) Données de test: Rapports variés
INSERT INTO reports (
  type, description, status, priority, department, address, latitude, longitude, population_id, assigned_admin_id, created_at, updated_at, actual_resolution_time
)
SELECT * FROM (
  SELECT 'Éclairage public'::text, 'Lampadaire en panne au coin de la rue.'::text, 'en-attente'::text, 'normal'::text,
         'Dakar'::text, 'Rue 12, Mermoz'::text, 14.692, -17.446, (SELECT id FROM new_pop LIMIT 1 OFFSET 0), (SELECT id FROM admin_test), now() - interval '2 days', now() - interval '1 days', NULL::interval
  UNION ALL
  SELECT 'Voirie', 'Nid de poule important gênant la circulation.', 'en-cours', 'high',
         'Dakar', 'Avenue Blaise Diagne', 14.708, -17.455, (SELECT id FROM new_pop LIMIT 1 OFFSET 1), (SELECT id FROM admin_test), now() - interval '3 days', now() - interval '1 days', NULL
  UNION ALL
  SELECT 'Déchets', 'Tas d''ordures non ramassé depuis plusieurs jours.', 'resolu', 'urgent',
         'Dakar', 'HLM Grand Yoff', 14.746, -17.455, (SELECT id FROM new_pop LIMIT 1 OFFSET 2), (SELECT id FROM admin_test), now() - interval '5 days', now() - interval '2 days', interval '36 hours'
  UNION ALL
  SELECT 'Eau', 'Fuite d''eau sur la voie publique.', 'rejete', 'low',
         'Dakar', 'Point E', 14.687, -17.464, (SELECT id FROM new_pop LIMIT 1 OFFSET 3), (SELECT id FROM admin_test), now() - interval '1 day', now(), NULL
  UNION ALL
  SELECT 'Sécurité', 'Attroupements nocturnes, nuisances sonores.', 'en-attente', 'normal',
         'Dakar', 'Ouakam', 14.723, -17.501, (SELECT id FROM new_pop LIMIT 1 OFFSET 4), (SELECT id FROM admin_test), now() - interval '6 hours', now() - interval '1 hours', NULL
) t;

-- 5) Index utiles pour les filtres/recherches
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_admin ON reports(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);

-- 6) Recalcul des statistiques du tableau de bord
INSERT INTO dashboard_stats (
  pending_reports,
  in_progress_reports,
  resolved_reports,
  rejected_reports,
  total_reports,
  avg_resolution_hours,
  today_reports,
  week_reports
)
SELECT 
  COUNT(*) FILTER (WHERE status = 'en-attente') AS pending_reports,
  COUNT(*) FILTER (WHERE status = 'en-cours') AS in_progress_reports,
  COUNT(*) FILTER (WHERE status = 'resolu') AS resolved_reports,
  COUNT(*) FILTER (WHERE status = 'rejete') AS rejected_reports,
  COUNT(*) AS total_reports,
  COALESCE(AVG(CASE WHEN actual_resolution_time IS NOT NULL THEN EXTRACT(EPOCH FROM actual_resolution_time)/3600 END), 0)::numeric AS avg_resolution_hours,
  COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS today_reports,
  COUNT(*) FILTER (WHERE created_at >= NOW() - interval '7 days') AS week_reports
FROM reports;