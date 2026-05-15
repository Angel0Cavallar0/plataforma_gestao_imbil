import type { RoleSlug } from "@/lib/constants";

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  registration_number: string;
  role_slug: RoleSlug;
  role_name: string;
  hierarchy_level: number;
  status: string;
  theme_preference: string;
  avatar_url: string | null;
  must_change_password: boolean;
}

export interface SessionContext {
  user: { id: string; email?: string };
  profile: UserProfile;
}

export interface NavPermissions {
  canAccessConfig: boolean;
  canManageUsers: boolean;
  canDeleteUsers: boolean;
  canDeleteAuditLogs: boolean;
  modules: { slug: string; name: string }[];
}
