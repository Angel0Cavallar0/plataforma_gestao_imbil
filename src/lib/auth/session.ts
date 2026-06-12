import { createClient } from "@/lib/supabase/server";
import { getAvatarSignedUrl } from "@/lib/storage/avatar";
import { canAccessConfig, canManageUsers, isSuperadmin } from "@/lib/auth/permissions";
import type { NavPermissions, SessionContext, UserProfile } from "@/types/auth";
import { redirect } from "next/navigation";

export async function getSession(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, roles!profiles_role_id_fkey(slug, name, hierarchy_level)")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status !== "ativo") return null;

  const roleData = profile.roles as
    | { slug: string; name: string; hierarchy_level: number }
    | { slug: string; name: string; hierarchy_level: number }[]
    | null;
  const role = Array.isArray(roleData) ? roleData[0] : roleData;
  if (!role) return null;

  const avatarDisplayUrl = await getAvatarSignedUrl(
    supabase,
    profile.avatar_url,
    profile.id,
  );

  const userProfile: UserProfile = {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    registration_number: profile.registration_number,
    role_slug: role.slug as UserProfile["role_slug"],
    role_name: role.name,
    hierarchy_level: role.hierarchy_level,
    status: profile.status,
    theme_preference: profile.theme_preference ?? "system",
    avatar_url: avatarDisplayUrl,
    must_change_password: profile.must_change_password ?? false,
  };

  return { user: { id: user.id, email: user.email }, profile: userProfile };
}

export async function requireAuth(): Promise<SessionContext> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireMinRole(
  profile: UserProfile,
  minSlug: UserProfile["role_slug"],
): Promise<void> {
  const { hasMinRole } = await import("@/lib/auth/permissions");
  if (!hasMinRole(profile, minSlug)) {
    redirect("/");
  }
}

export async function getNavPermissions(profile: UserProfile): Promise<NavPermissions> {
  const supabase = await createClient();
  const { data: modules } = await supabase
    .from("modules")
    .select("slug, name")
    .order("display_order");

  let accessibleModules = modules ?? [];

  if (profile.role_slug === "operacao") {
    const { data: access } = await supabase
      .from("user_module_access")
      .select("modules(slug, name)")
      .eq("user_id", profile.id);

    accessibleModules =
      access
        ?.map((a) => {
          const raw = a.modules as
            | { slug: string; name: string }
            | { slug: string; name: string }[]
            | null;
          const m = Array.isArray(raw) ? raw[0] : raw;
          return { slug: m?.slug ?? "", name: m?.name ?? "" };
        })
        .filter((m) => m.slug) ?? [];
  }

  return {
    canAccessConfig: canAccessConfig(profile),
    canManageUsers: canManageUsers(profile),
    canDeleteUsers: isSuperadmin(profile),
    canDeleteAuditLogs: isSuperadmin(profile),
    modules: accessibleModules,
  };
}
