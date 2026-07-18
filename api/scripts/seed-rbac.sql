-- Seed roles, permissions, and the role→permission matrix.
-- Idempotent: re-runnable with INSERT OR IGNORE. Ids are the human-readable
-- keys so the seed stays readable and stable. Keep in sync with src/policies/rbac.ts.

-- ── Roles (ordered ladder) ───────────────────────────────────────────────────
INSERT OR IGNORE INTO roles (id, key, name, rank) VALUES
  ('unverified',       'unverified',       'Unverified',       0),
  ('pending',          'pending',          'Pending Verification', 1),
  ('verified_student', 'verified_student', 'Verified Student', 2),
  ('moderator',        'moderator',        'Moderator',        3),
  ('admin',            'admin',            'Admin',            4),
  ('super_admin',      'super_admin',      'Super Admin',      5);

-- ── Permissions ──────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO permissions (id, key, description) VALUES
  ('uploads.create',   'uploads.create',   'Create uploads'),
  ('uploads.moderate', 'uploads.moderate', 'Approve/flag/feature uploads'),
  ('uploads.delete',   'uploads.delete',   'Delete/restore uploads'),
  ('users.verify',     'users.verify',     'Review and decide verifications'),
  ('users.ban',        'users.ban',        'Suspend/ban users'),
  ('users.delete',     'users.delete',     'Delete/restore users'),
  ('admins.manage',    'admins.manage',    'Create/modify admin accounts'),
  ('roles.manage',     'roles.manage',     'Edit roles and permissions'),
  ('data.export',      'data.export',      'Export data'),
  ('settings.edit',    'settings.edit',    'Edit system settings'),
  ('analytics.read',   'analytics.read',   'View analytics'),
  ('security.read',    'security.read',    'View security dashboard'),
  ('audit.read',       'audit.read',       'View audit logs');

-- ── Role → Permission matrix (cumulative up the ladder) ──────────────────────
-- verified_student
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
  ('verified_student', 'uploads.create');

-- moderator
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
  ('moderator', 'uploads.create'),
  ('moderator', 'uploads.moderate'),
  ('moderator', 'uploads.delete'),
  ('moderator', 'users.verify'),
  ('moderator', 'analytics.read'),
  ('moderator', 'security.read'),
  ('moderator', 'audit.read');

-- admin
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
  ('admin', 'uploads.create'),
  ('admin', 'uploads.moderate'),
  ('admin', 'uploads.delete'),
  ('admin', 'users.verify'),
  ('admin', 'users.ban'),
  ('admin', 'users.delete'),
  ('admin', 'data.export'),
  ('admin', 'settings.edit'),
  ('admin', 'analytics.read'),
  ('admin', 'security.read'),
  ('admin', 'audit.read');

-- super_admin (everything)
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
  SELECT 'super_admin', key FROM permissions;
