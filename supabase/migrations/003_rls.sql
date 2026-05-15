ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- modules, departments, positions, roles: read authenticated, write superadmin
CREATE POLICY modules_select ON modules FOR SELECT TO authenticated USING (true);
CREATE POLICY modules_write ON modules FOR ALL TO authenticated
  USING (current_user_role_level() >= 100) WITH CHECK (current_user_role_level() >= 100);

CREATE POLICY departments_select ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY departments_write ON departments FOR ALL TO authenticated
  USING (current_user_role_level() >= 100) WITH CHECK (current_user_role_level() >= 100);

CREATE POLICY positions_select ON positions FOR SELECT TO authenticated USING (true);
CREATE POLICY positions_write ON positions FOR ALL TO authenticated
  USING (current_user_role_level() >= 100) WITH CHECK (current_user_role_level() >= 100);

CREATE POLICY roles_select ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY roles_write ON roles FOR ALL TO authenticated
  USING (current_user_role_level() >= 100) WITH CHECK (current_user_role_level() >= 100);

-- profiles
CREATE POLICY profiles_select_own ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_select_supervisao ON profiles FOR SELECT TO authenticated
  USING (current_user_role_level() >= 40);

CREATE POLICY profiles_insert_gestor ON profiles FOR INSERT TO authenticated
  WITH CHECK (current_user_role_level() >= 60);

CREATE POLICY profiles_update_gestor ON profiles FOR UPDATE TO authenticated
  USING (current_user_role_level() >= 60) WITH CHECK (current_user_role_level() >= 60);

CREATE POLICY profiles_delete_superadmin ON profiles FOR DELETE TO authenticated
  USING (current_user_role_level() >= 100);

-- permissions read all authenticated
CREATE POLICY permissions_select ON permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY permissions_write ON permissions FOR ALL TO authenticated
  USING (current_user_role_level() >= 100) WITH CHECK (current_user_role_level() >= 100);

-- role_permissions, user_module_access, user_permissions
CREATE POLICY role_permissions_select ON role_permissions FOR SELECT TO authenticated
  USING (current_user_role_level() >= 40);

CREATE POLICY role_permissions_write ON role_permissions FOR ALL TO authenticated
  USING (current_user_role_level() >= 60) WITH CHECK (current_user_role_level() >= 60);

CREATE POLICY user_module_access_select ON user_module_access FOR SELECT TO authenticated
  USING (current_user_role_level() >= 40 OR user_id = auth.uid());

CREATE POLICY user_module_access_write ON user_module_access FOR ALL TO authenticated
  USING (current_user_role_level() >= 60) WITH CHECK (current_user_role_level() >= 60);

CREATE POLICY user_permissions_select ON user_permissions FOR SELECT TO authenticated
  USING (current_user_role_level() >= 40 OR user_id = auth.uid());

CREATE POLICY user_permissions_write ON user_permissions FOR ALL TO authenticated
  USING (current_user_role_level() >= 60) WITH CHECK (current_user_role_level() >= 60);

-- audit_logs
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT TO authenticated
  USING (current_user_role_level() >= 40);

CREATE POLICY audit_logs_delete ON audit_logs FOR DELETE TO authenticated
  USING (current_user_role_level() >= 100);

-- security tables: read supervisao+, write via service role only (no client policies for insert)
CREATE POLICY login_attempts_select ON login_attempts FOR SELECT TO authenticated
  USING (current_user_role_level() >= 40);

CREATE POLICY account_lockouts_select ON account_lockouts FOR SELECT TO authenticated
  USING (current_user_role_level() >= 40);

CREATE POLICY password_tokens_select ON password_reset_tokens FOR SELECT TO authenticated
  USING (current_user_role_level() >= 40);

CREATE POLICY email_logs_select ON email_logs FOR SELECT TO authenticated
  USING (current_user_role_level() >= 40);
