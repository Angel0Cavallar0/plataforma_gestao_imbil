"use server";

import { requireAuth } from "@/lib/auth/session";
import { logAction } from "@/lib/auth/audit";
import { THEME_PREFERENCES, type ThemePreference } from "@/lib/constants";
import { getAvatarSignedUrl, removeStaleAvatarFiles } from "@/lib/storage/avatar";
import { createClient } from "@/lib/supabase/server";
import { avatarFileSchema, parseMyProfileFormData } from "@/lib/validations/profile";
import { z } from "zod";
import type { Json } from "@/types/database";
import { revalidatePath } from "next/cache";

const AVATAR_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const themePreferenceSchema = z.enum(THEME_PREFERENCES);

export async function updateThemePreferenceAction(theme: ThemePreference) {
  const session = await requireAuth();
  const parsed = themePreferenceSchema.safeParse(theme);
  if (!parsed.success) return { error: "Tema inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      theme_preference: parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.profile.id);

  if (error) return { error: error.message };

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { success: true as const };
}

export async function updateMyProfileAction(formData: FormData) {
  const session = await requireAuth();
  const parsed = parseMyProfileFormData(formData);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { birth_date, address, ...rest } = parsed.data;

  const updates = {
    phone: rest.phone,
    whatsapp: rest.whatsapp,
    birth_date: birth_date || null,
    address: (address ?? null) as Json | null,
    theme_preference: rest.theme_preference,
    language: rest.language,
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", session.profile.id);

  if (error) return { error: error.message };

  await logAction({
    userId: session.profile.id,
    action: "profile.self_updated",
    resourceType: "profile",
    resourceId: session.profile.id,
    metadata: { fields: Object.keys(updates) },
  });

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { success: true as const };
}

export async function uploadAvatarAction(formData: FormData) {
  const session = await requireAuth();
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione uma imagem." };
  }

  const parsed = avatarFileSchema.safeParse(file);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Arquivo inválido." };
  }

  const ext = AVATAR_EXT[parsed.data.type] ?? "jpg";
  const path = `${session.profile.id}/avatar.${ext}`;
  const supabase = await createClient();

  const fileBytes = new Uint8Array(await parsed.data.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, fileBytes, {
      contentType: parsed.data.type,
      upsert: true,
    });

  if (uploadError) return { error: uploadError.message };

  await removeStaleAvatarFiles(supabase, session.profile.id, path);

  const updatedAt = new Date().toISOString();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      avatar_url: path,
      updated_at: updatedAt,
    })
    .eq("id", session.profile.id);

  if (profileError) return { error: profileError.message };

  const avatarUrl = await getAvatarSignedUrl(supabase, path, session.profile.id);

  await logAction({
    userId: session.profile.id,
    action: "profile.avatar_updated",
    resourceType: "profile",
    resourceId: session.profile.id,
  });

  revalidatePath("/perfil");
  revalidatePath("/", "layout");
  return { success: true as const, avatarUrl: avatarUrl ?? undefined };
}
