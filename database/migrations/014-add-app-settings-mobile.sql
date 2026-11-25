-- Migration: 014-add-app-settings-mobile
-- Description: Ajoute les paramètres mobiles (test_mode, latest_app_version, is_update_required, is_under_maintenance)
-- Date: 2026-11-25

INSERT INTO app_settings (setting_key, setting_value, setting_type, category, description, is_public, is_editable) VALUES
('is_under_maintenance', 'false', 'boolean', 'system', 'Application en maintenance', TRUE, TRUE),
('test_mode', 'false', 'boolean', 'system', 'Mode test', FALSE, TRUE),
('latest_app_version', '1.0.0', 'string', 'general', 'Derniere version disponible', TRUE, TRUE),
('is_update_required', 'false', 'boolean', 'system', 'Mise a jour obligatoire', TRUE, TRUE)
ON CONFLICT (setting_key) DO NOTHING;
