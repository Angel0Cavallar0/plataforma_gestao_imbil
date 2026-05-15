export const ROLE_SLUGS = [
  "superadmin",
  "diretoria",
  "gestor",
  "supervisao",
  "operacao",
] as const;

export type RoleSlug = (typeof ROLE_SLUGS)[number];

export const ROLE_HIERARCHY: Record<RoleSlug, number> = {
  superadmin: 100,
  diretoria: 80,
  gestor: 60,
  supervisao: 40,
  operacao: 20,
};

export const MIN_LEVEL_SUPERVISAO = ROLE_HIERARCHY.supervisao;
export const MIN_LEVEL_GESTOR = ROLE_HIERARCHY.gestor;

export const MODULES = [
  { slug: "marketing", name: "Marketing", icon: "megaphone" },
  { slug: "atendimento", name: "Atendimento", icon: "headphones" },
  { slug: "comercial", name: "Comercial", icon: "handshake" },
  { slug: "financeiro", name: "Financeiro", icon: "wallet" },
  { slug: "industrial", name: "Industrial", icon: "factory" },
  { slug: "rh", name: "RH", icon: "users" },
] as const;

export const PERMISSION_ACTIONS = [
  "read",
  "create",
  "update",
  "delete",
  "approve",
  "export",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const PROFILE_STATUSES = ["ativo", "inativo", "bloqueado"] as const;

export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const LANGUAGES = ["pt-BR"] as const;
export type Language = (typeof LANGUAGES)[number];

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
export const PASSWORD_TOKEN_TTL_MINUTES = 30;
export const PASSWORD_CHANGE_INTERVAL_DAYS = 90;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 15;
export const MAX_LOCKOUT_CYCLES = 3;
