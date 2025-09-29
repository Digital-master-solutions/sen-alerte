-- Supprimer d'abord les notifications liées aux signalements
DELETE FROM notifications WHERE report_id IS NOT NULL;

-- Ensuite supprimer tous les signalements de test
DELETE FROM reports;