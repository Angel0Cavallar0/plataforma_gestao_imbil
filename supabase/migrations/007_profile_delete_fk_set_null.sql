-- Permite excluir usuários (auth/profiles) sem bloquear por registros históricos
-- ou referências opcionais em outras linhas.

ALTER TABLE email_logs
  DROP CONSTRAINT email_logs_related_user_id_fkey,
  ADD CONSTRAINT email_logs_related_user_id_fkey
    FOREIGN KEY (related_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE audit_logs
  DROP CONSTRAINT audit_logs_user_id_fkey,
  ADD CONSTRAINT audit_logs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE password_reset_tokens
  DROP CONSTRAINT password_reset_tokens_requested_by_fkey,
  ADD CONSTRAINT password_reset_tokens_requested_by_fkey
    FOREIGN KEY (requested_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE profiles
  DROP CONSTRAINT profiles_manager_id_fkey,
  ADD CONSTRAINT profiles_manager_id_fkey
    FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE profiles
  DROP CONSTRAINT profiles_created_by_fkey,
  ADD CONSTRAINT profiles_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE profiles
  DROP CONSTRAINT profiles_deactivated_by_fkey,
  ADD CONSTRAINT profiles_deactivated_by_fkey
    FOREIGN KEY (deactivated_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE user_module_access
  DROP CONSTRAINT user_module_access_granted_by_fkey,
  ADD CONSTRAINT user_module_access_granted_by_fkey
    FOREIGN KEY (granted_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE user_permissions
  DROP CONSTRAINT user_permissions_granted_by_fkey,
  ADD CONSTRAINT user_permissions_granted_by_fkey
    FOREIGN KEY (granted_by) REFERENCES profiles(id) ON DELETE SET NULL;
