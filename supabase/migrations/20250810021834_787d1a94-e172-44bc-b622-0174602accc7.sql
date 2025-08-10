-- Insérer des organisations de test avec un type valide (respect de organizations_type_check)
INSERT INTO organizations (name, type, email, phone, city, address, status, is_active, approved_at)
VALUES 
  ('Mairie Centre', 'mairie', 'contact@mairie-centre.sn', '+221700000001', 'Dakar', 'Plateau', 'approved', true, now()),
  ('Propreté Urbaine', 'mairie', 'support@proprete.sn', '+221700000002', 'Dakar', 'Hann Bel-Air', 'approved', true, now()),
  ('Association Quartier Propre', 'ong', 'asso@quartierpropre.sn', '+221700000003', 'Dakar', 'Grand Dakar', 'approved', true, now()),
  ('SENNET Services', 'prive', 'contact@sennet.sn', '+221700000004', 'Dakar', 'Fann', 'approved', true, now()),
  ('Jeunes Volontaires', 'benevolat', 'jv@volontaires.sn', '+221700000005', 'Dakar', 'Medina', 'approved', true, now());