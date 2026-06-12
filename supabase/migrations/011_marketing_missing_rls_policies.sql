-- Recreate RLS policies that may be missing if migration 008 was applied partially.

DROP POLICY IF EXISTS credentials_select ON marketing.integration_credentials;
DROP POLICY IF EXISTS credentials_insert ON marketing.integration_credentials;
DROP POLICY IF EXISTS credentials_update ON marketing.integration_credentials;
DROP POLICY IF EXISTS credentials_delete ON marketing.integration_credentials;

CREATE POLICY credentials_select ON marketing.integration_credentials
  FOR SELECT TO authenticated
  USING (current_user_role_level() >= 60);

CREATE POLICY credentials_insert ON marketing.integration_credentials
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role_level() >= 60);

CREATE POLICY credentials_update ON marketing.integration_credentials
  FOR UPDATE TO authenticated
  USING (current_user_role_level() >= 60)
  WITH CHECK (current_user_role_level() >= 60);

CREATE POLICY credentials_delete ON marketing.integration_credentials
  FOR DELETE TO authenticated
  USING (current_user_role_level() >= 100);

DROP POLICY IF EXISTS sync_runs_select ON marketing.sync_runs;
CREATE POLICY sync_runs_select ON marketing.sync_runs
  FOR SELECT TO authenticated
  USING (current_user_role_level() >= 40);

DROP POLICY IF EXISTS comments_select ON marketing.content_comments;
DROP POLICY IF EXISTS comments_insert ON marketing.content_comments;
DROP POLICY IF EXISTS comments_update ON marketing.content_comments;
DROP POLICY IF EXISTS comments_delete ON marketing.content_comments;

CREATE POLICY comments_select ON marketing.content_comments
  FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'marketing', 'read'));

CREATE POLICY comments_insert ON marketing.content_comments
  FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'marketing', 'create') AND author_id = auth.uid());

CREATE POLICY comments_update ON marketing.content_comments
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR current_user_role_level() >= 60)
  WITH CHECK (author_id = auth.uid() OR current_user_role_level() >= 60);

CREATE POLICY comments_delete ON marketing.content_comments
  FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR current_user_role_level() >= 60);

NOTIFY pgrst, 'reload schema';
