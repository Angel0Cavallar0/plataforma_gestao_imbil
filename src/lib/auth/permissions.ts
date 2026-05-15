import {
  MIN_LEVEL_GESTOR,
  MIN_LEVEL_SUPERVISAO,
  ROLE_HIERARCHY,
  type RoleSlug,
} from "@/lib/constants";
import type { UserProfile } from "@/types/auth";

export function getRoleLevel(slug: RoleSlug): number {
  return ROLE_HIERARCHY[slug];
}

export function hasMinRole(profile: UserProfile, minSlug: RoleSlug): boolean {
  if (profile.role_slug === "diretoria" && minSlug === "supervisao") {
    return false;
  }
  return profile.hierarchy_level >= ROLE_HIERARCHY[minSlug];
}

export function canAccessConfig(profile: UserProfile): boolean {
  return (
    profile.role_slug !== "diretoria" && profile.hierarchy_level >= MIN_LEVEL_SUPERVISAO
  );
}

export function canManageUsers(profile: UserProfile): boolean {
  return profile.hierarchy_level >= MIN_LEVEL_GESTOR;
}

export function canViewOrgStructure(profile: UserProfile): boolean {
  return canAccessConfig(profile);
}

export function canManageOrgStructure(profile: UserProfile): boolean {
  return canManageUsers(profile);
}

export function isSuperadmin(profile: UserProfile): boolean {
  return profile.role_slug === "superadmin";
}

export function canUnlockOrResetPassword(profile: UserProfile): boolean {
  return profile.hierarchy_level >= MIN_LEVEL_SUPERVISAO;
}
