import { describe, expect, it } from "vitest";
import {
  canAccessConfig,
  canManageUsers,
  hasMinRole,
} from "@/lib/auth/permissions";
import type { UserProfile } from "@/types/auth";

function profile(overrides: Partial<UserProfile>): UserProfile {
  return {
    id: "1",
    full_name: "Test",
    email: "t@imbil.com",
    registration_number: "001",
    role_slug: "supervisao",
    role_name: "Supervisão",
    hierarchy_level: 40,
    status: "ativo",
    theme_preference: "system",
    avatar_url: null,
    must_change_password: false,
    ...overrides,
  };
}

describe("permissions", () => {
  it("supervisao can access config", () => {
    expect(canAccessConfig(profile({ role_slug: "supervisao", hierarchy_level: 40 }))).toBe(
      true,
    );
  });

  it("diretoria cannot access config", () => {
    expect(canAccessConfig(profile({ role_slug: "diretoria", hierarchy_level: 80 }))).toBe(
      false,
    );
  });

  it("supervisao cannot manage users", () => {
    expect(canManageUsers(profile({ role_slug: "supervisao", hierarchy_level: 40 }))).toBe(
      false,
    );
  });

  it("gestor can manage users", () => {
    expect(canManageUsers(profile({ role_slug: "gestor", hierarchy_level: 60 }))).toBe(true);
  });

  it("hasMinRole respects hierarchy", () => {
    expect(hasMinRole(profile({ hierarchy_level: 60 }), "supervisao")).toBe(true);
    expect(hasMinRole(profile({ hierarchy_level: 40 }), "gestor")).toBe(false);
  });
});
