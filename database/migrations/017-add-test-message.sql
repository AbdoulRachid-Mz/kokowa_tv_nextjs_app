-- Migration: 017-add-test-message
-- Description: Ajoute le paramètre test_message
-- Date: 2026-11-27

INSERT INTO app_settings (setting_key, setting_value, setting_type, category, description, is_public, is_editable) VALUES
('test_message', 'Mode test active.', 'string', 'system', 'Message affiche en mode test', TRUE, TRUE)
ON CONFLICT (setting_key) DO NOTHING;
