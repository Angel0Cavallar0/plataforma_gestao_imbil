INSERT INTO modules (slug, name, description, icon, display_order) VALUES
  ('marketing', 'Marketing', 'Módulo de Marketing', 'megaphone', 1),
  ('atendimento', 'Atendimento', 'Módulo de Atendimento', 'headphones', 2),
  ('comercial', 'Comercial', 'Módulo Comercial', 'handshake', 3),
  ('financeiro', 'Financeiro', 'Módulo Financeiro', 'wallet', 4),
  ('industrial', 'Industrial', 'Módulo Industrial', 'factory', 5),
  ('rh', 'RH', 'Módulo de RH', 'users', 6);

INSERT INTO roles (slug, name, description, hierarchy_level) VALUES
  ('superadmin', 'Super Admin', 'Acesso total', 100),
  ('diretoria', 'Diretoria', 'Visão geral', 80),
  ('gestor', 'Gestor', 'Gestão operacional', 60),
  ('supervisao', 'Supervisão', 'Supervisão de área', 40),
  ('operacao', 'Operação', 'Operação restrita', 20);

INSERT INTO permissions (module_id, action)
SELECT m.id, a.action
FROM modules m
CROSS JOIN (
  VALUES ('read'), ('create'), ('update'), ('delete'), ('approve'), ('export')
) AS a(action);

-- superadmin: all
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.slug = 'superadmin';

-- diretoria: read + export
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.action IN ('read', 'export')
WHERE r.slug = 'diretoria';

-- gestor: all
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.slug = 'gestor';

-- supervisao: read, create, update, export
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.action IN ('read', 'create', 'update', 'export')
WHERE r.slug = 'supervisao';

-- operacao: read, create, update (module access enforced in has_permission)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.action IN ('read', 'create', 'update')
WHERE r.slug = 'operacao';
