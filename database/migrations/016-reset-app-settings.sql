-- Migration: 016-reset-app-settings
-- Description: Nettoie et réinitialise la table app_settings avec les bonnes données alignées au code
-- Date: 2026-11-27

TRUNCATE TABLE app_settings RESTART IDENTITY CASCADE;

INSERT INTO app_settings (setting_key, setting_value, setting_type, category, description, is_public, is_editable) VALUES
  ('sub_group_default_period', 'matin', 'string', 'competition', 'Période par défaut des sous-groupes', FALSE, TRUE),
  ('latest_app_version', '1.0.0', 'string', 'general', 'Dernière version disponible', TRUE, TRUE),
  ('points_per_draw', '1', 'number', 'scoring', 'Points de classement pour un match nul', FALSE, TRUE),
  ('points_per_win', '3', 'number', 'scoring', 'Points de classement pour une victoire', FALSE, TRUE),
  ('is_under_maintenance', 'false', 'boolean', 'system', 'Application en maintenance', TRUE, TRUE),
  ('is_update_required', 'false', 'boolean', 'system', 'Mise à jour obligatoire', TRUE, TRUE),
  ('test_mode', 'false', 'boolean', 'system', 'Mode test', FALSE, TRUE),
  ('send_match_push', 'true', 'boolean', 'notifications', 'Envoyer les notifications de correspondance', FALSE, TRUE),
  ('app_update_url', '', 'string', 'general', 'URL de mise à jour de l application', TRUE, TRUE),
  ('maintenance_message', 'Application en maintenance, veuillez réessayer plus tard.', 'string', 'system', 'Message affiché en mode maintenance', TRUE, TRUE),
  ('min_app_version', '1.0.0', 'string', 'system', 'Version minimale requise', TRUE, TRUE),
  ('force_update', 'false', 'boolean', 'system', 'Forcer la mise à jour', TRUE, TRUE),
  ('app_name', 'Kokowa TV', 'string', 'general', 'Nom de l application', TRUE, TRUE),
  ('app_description', 'Plateforme de gestion des compétitions de lutte traditionnelle', 'string', 'general', 'Description de l application', TRUE, TRUE),
  ('app_version', '1.0.0', 'string', 'general', 'Version de l application', TRUE, FALSE),
  ('contact_email', 'contact@lutte-traditionnelle.com', 'string', 'contact', 'Email de contact', TRUE, TRUE),
  ('support_email', 'support@lutte-traditionnelle.com', 'string', 'contact', 'Email de support', TRUE, TRUE),
  ('analytics_tracking_id', '', 'string', 'analytics', 'ID de suivi Google Analytics', FALSE, TRUE),
  ('registration_enabled', 'true', 'boolean', 'auth', 'Inscription des utilisateurs activée', TRUE, TRUE),
  ('default_language', 'fr', 'string', 'localization', 'Langue par défaut', TRUE, TRUE),
  ('supported_languages', '["fr", "ha", "en"]', 'json', 'localization', 'Langues supportées', TRUE, TRUE),
  ('match_duration', '300', 'number', 'matches', 'Durée par défaut d un match (secondes)', FALSE, TRUE),
  ('max_breaks_per_match', '3', 'number', 'matches', 'Nombre maximum de pauses par match', FALSE, TRUE),
  ('match_timeout_seconds', '600', 'number', 'matches', 'Durée maximale d un match (secondes)', FALSE, TRUE),
  ('max_cards_per_match', '5', 'number', 'matches', 'Nombre maximum de cartons par match', FALSE, TRUE),
  ('ranking_points_win', '3', 'number', 'ranking', 'Points de classement pour une victoire', FALSE, TRUE),
  ('ranking_points_draw', '1', 'number', 'ranking', 'Points de classement pour un match nul', FALSE, TRUE),
  ('ranking_points_loss', '0', 'number', 'ranking', 'Points de classement pour une défaite', FALSE, TRUE),
  ('notifications_enabled', 'true', 'boolean', 'notifications', 'Notifications activées', TRUE, TRUE),
  ('social_links', '{"facebook": "", "twitter": "", "instagram": "", "youtube": ""}', 'json', 'social', 'Liens vers les réseaux sociaux', TRUE, TRUE),
  ('max_file_size', '10485760', 'number', 'media', 'Taille maximale des fichiers uploadés (en bytes)', FALSE, TRUE),
  ('allowed_file_types', '["image/jpeg", "image/png", "image/gif", "video/mp4"]', 'json', 'media', 'Types de fichiers autorisés', FALSE, TRUE),
  ('app_logo_url', '', 'string', 'general', 'URL du logo de l application', TRUE, TRUE),
  ('terms_url', '', 'string', 'legal', 'URL des conditions d utilisation', TRUE, TRUE),
  ('privacy_url', '', 'string', 'legal', 'URL de la politique de confidentialité', TRUE, TRUE),
  ('maintenance_message', 'Application en maintenance, veuillez réessayer plus tard.', 'string', 'system', 'Message affiché en mode maintenance', TRUE, TRUE),
  ('min_app_version', '1.0.0', 'string', 'system', 'Version minimale requise', TRUE, TRUE),
  ('force_update', 'false', 'boolean', 'system', 'Forcer la mise à jour', TRUE, TRUE),
  ('app_update_url', '', 'string', 'general', 'URL de mise à jour de l application', TRUE, TRUE)
ON CONFLICT (setting_key) DO NOTHING;
