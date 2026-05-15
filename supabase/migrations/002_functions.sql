CREATE OR REPLACE FUNCTION current_user_role_level() RETURNS int AS $$
  SELECT r.hierarchy_level
  FROM profiles p
  JOIN roles r ON p.role_id = r.id
  WHERE p.id = auth.uid() AND p.status = 'ativo';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_permission(
  p_user_id uuid,
  p_module_slug text,
  p_action text
) RETURNS boolean AS $$
DECLARE
  v_user_role_slug text;
  v_module_id uuid;
  v_permission_id uuid;
  v_has_module_access boolean;
  v_role_grants boolean;
  v_user_override boolean;
BEGIN
  SELECT r.slug INTO v_user_role_slug
  FROM profiles p
  JOIN roles r ON p.role_id = r.id
  WHERE p.id = p_user_id AND p.status = 'ativo';

  IF v_user_role_slug IS NULL THEN RETURN false; END IF;
  IF v_user_role_slug = 'superadmin' THEN RETURN true; END IF;

  SELECT id INTO v_module_id FROM modules WHERE slug = p_module_slug;
  SELECT id INTO v_permission_id
  FROM permissions
  WHERE module_id = v_module_id AND action = p_action;

  IF v_permission_id IS NULL THEN RETURN false; END IF;

  SELECT granted INTO v_user_override
  FROM user_permissions
  WHERE user_id = p_user_id AND permission_id = v_permission_id;

  IF v_user_override IS NOT NULL THEN RETURN v_user_override; END IF;

  IF v_user_role_slug = 'operacao' THEN
    SELECT EXISTS (
      SELECT 1 FROM user_module_access
      WHERE user_id = p_user_id AND module_id = v_module_id
    ) INTO v_has_module_access;
    IF NOT v_has_module_access THEN RETURN false; END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM role_permissions rp
    JOIN profiles p ON p.role_id = rp.role_id
    WHERE p.id = p_user_id AND rp.permission_id = v_permission_id
  ) INTO v_role_grants;

  RETURN COALESCE(v_role_grants, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
