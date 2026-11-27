-- Migration: 015-add-app-settings-extra
-- Description: Ajoute les parametres supplementaires (maintenance_message, ranking_points_loss, notifications_enabled, app_logo_url, support_email, terms_url, privacy_url, min_app_version, force_update, match_timeout_seconds, max_cards_per_match)
-- Date: 2026-11-27

INSERT INTO app_settings (setting_key, setting_value, setting_type, category, description, is_public, is_editable) VALUES
('maintenance_message', 'Application en maintenance, veuillez reessayer plus tard.', 'string', 'system', 'Message affiche en mode maintenance', TRUE, TRUE),
('ranking_points_loss', '0', 'number', 'ranking', 'Points de classement pour une defaite', FALSE, TRUE),
('notifications_enabled', 'true', 'boolean', 'notifications', 'Notifications activees', TRUE, TRUE),
('app_logo_url', '', 'string', 'general', 'URL du logo de l application', TRUE, TRUE),
('support_email', 'support@lutte-traditionnelle.com', 'string', 'contact', 'Email de support', TRUE, TRUE),
('terms_url', '', 'string', 'legal', 'URL des conditions d utilisation', TRUE, TRUE),
('privacy_url', '', 'string', 'legal', 'URL de la politique de confidentialite', TRUE, TRUE),
('min_app_version', '1.0.0', 'string', 'system', 'Version minimale requise', TRUE, TRUE),
('force_update', 'false', 'boolean', 'system', 'Forcer la mise a jour', TRUE, TRUE),
('match_timeout_seconds', '600', 'number', 'matches', 'Duree maximale d un match (secondes)', FALSE, TRUE),
('max_cards_per_match', '5', 'number', 'matches', 'Nombre maximum de cartons par match', FALSE, TRUE)
ON CONFLICT (setting_key) DO NOTHING;
