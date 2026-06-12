"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { marketingSchema } from "@/lib/supabase/marketing";
import { requireAuth } from "@/lib/auth/session";
import { requireMarketingPermission } from "@/lib/auth/marketing";
import { logAction } from "@/lib/auth/audit";
import { hasMinRole } from "@/lib/auth/permissions";
import {
  CONTENT_TYPES_REQUIRING_MEDIA,
  MARKETING_STORAGE_BUCKET,
  POST_STATUS_TRANSITIONS,
} from "@/lib/constants/marketing";
import { validateCarouselAssetCount } from "@/lib/marketing/content-assets";
import { logPostError } from "@/lib/marketing/publish-error-log";
import {
  changeStatusSchema,
  createCampaignSchema,
  createPostSchema,
  requiresCopyForPublish,
  reschedulePostSchema,
  updatePostSchema,
  validateAssetForPlatform,
  type CreateCampaignInput,
  type CreatePostInput,
  type UpdatePostInput,
} from "@/lib/validations/marketing/content";
import {
  deleteMetaPost,
  editMetaPost,
  publishToMeta,
} from "@/lib/integrations/meta/publish";
import type { ContentType, PostStatus } from "@/types/marketing";

const REVALIDATE_PATHS = [
  "/modulos/marketing/calendario-conteudo",
  "/modulos/marketing/calendario-conteudo/lista",
];

function revalidateCalendar() {
  for (const p of REVALIDATE_PATHS) revalidatePath(p);
}

async function getPlatformSlug(platformId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await marketingSchema(supabase)
    .from("platforms")
    .select("slug")
    .eq("id", platformId)
    .single();
  return (data?.slug as string) ?? "";
}

export async function createPostAction(input: CreatePostInput) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "create");
  const data = createPostSchema.parse(input);
  const supabase = await createClient();

  const { data: post, error } = await marketingSchema(supabase)
    .from("content_posts")
    .insert({
      ...data,
      scheduled_at: data.scheduled_at.toISOString(),
      created_by: session.user.id,
      status: "rascunho",
      cta_url: data.cta_url || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await logAction({
    userId: session.user.id,
    action: "mkt.content_post.created",
    resourceType: "marketing.content_post",
    resourceId: post.id,
    metadata: { platform_id: data.platform_id },
  });
  revalidateCalendar();
  return { data: post };
}

/**
 * Cria um post por plataforma (mesmo conteúdo, contas distintas).
 * O agendamento fica a cargo do cliente, após o upload das mídias —
 * agendar antes deixaria posts "agendado" sem mídia na fila do cron.
 */
export async function createPostsBatchAction(input: { posts: CreatePostInput[] }) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "create");

  if (!input.posts.length) {
    return { error: "Selecione ao menos uma rede social" };
  }

  const createdIds: string[] = [];
  const errors: string[] = [];

  for (const postInput of input.posts) {
    const res = await createPostAction(postInput);
    if (res.error) {
      errors.push(typeof res.error === "string" ? res.error : "Erro ao criar post");
      continue;
    }
    const id = res.data?.id as string;
    if (!id) continue;
    createdIds.push(id);
  }

  if (!createdIds.length) {
    return { error: errors[0] ?? "Nenhum post foi criado" };
  }

  revalidateCalendar();
  return {
    data: { ids: createdIds, firstId: createdIds[0] },
    partialErrors: errors.length ? errors : undefined,
  };
}

export async function updatePostAction(input: UpdatePostInput) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "update");
  const parsed = updatePostSchema.parse(input);
  const { id, ...rest } = parsed;

  const supabase = await createClient();
  const { data: existing } = await marketingSchema(supabase)
    .from("content_posts")
    .select("created_by, status, platform:platforms(slug)")
    .eq("id", id)
    .single();

  if (!existing) return { error: "Post não encontrado" };
  if (
    existing.created_by !== session.user.id &&
    !hasMinRole(session.profile, "supervisao")
  ) {
    return { error: "Sem permissão para editar este post" };
  }

  const payload: Record<string, unknown> = { ...rest };
  if (rest.scheduled_at) payload.scheduled_at = rest.scheduled_at.toISOString();

  const { data: post, error } = await marketingSchema(supabase)
    .from("content_posts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  if (existing.status === "publicado") {
    const platform = existing.platform as unknown as { slug: string };
    if (
      platform.slug === "facebook" &&
      (rest.copy !== undefined || rest.hashtags !== undefined)
    ) {
      try {
        await editMetaPost(
          id,
          rest.copy ?? (post.copy as string | null),
          rest.hashtags ?? (post.hashtags as string[] | null),
        );
      } catch (e) {
        return {
          error: e instanceof Error ? e.message : "Falha ao atualizar legenda na Meta",
        };
      }
    }
  }

  await logAction({
    userId: session.user.id,
    action: "mkt.content_post.updated",
    resourceType: "marketing.content_post",
    resourceId: id,
  });
  revalidateCalendar();
  return { data: post };
}

type ScheduleResult = { ok: true; error?: undefined } | { ok?: undefined; error: string };

/** Registra a falha de agendamento e devolve o erro para a UI. */
async function failSchedule(
  postId: string,
  userId: string,
  message: string,
): Promise<ScheduleResult> {
  await logPostError({ postId, stage: "agendamento", message, userId });
  return { error: message };
}

export async function schedulePostAction(id: string): Promise<ScheduleResult> {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "update");
  const supabase = await createClient();

  const { data: post } = await marketingSchema(supabase)
    .from("content_posts")
    .select("content_type, copy, hashtags, status")
    .eq("id", id)
    .single();

  if (!post) return { error: "Post não encontrado" };
  if (!POST_STATUS_TRANSITIONS[post.status as PostStatus]?.includes("agendado")) {
    return failSchedule(id, session.user.id, "Transição de status inválida");
  }
  if (requiresCopyForPublish(post.content_type as ContentType) && !post.copy?.trim()) {
    return failSchedule(
      id,
      session.user.id,
      "Legenda é obrigatória para agendar este tipo de post",
    );
  }

  if (
    CONTENT_TYPES_REQUIRING_MEDIA.includes(post.content_type as ContentType)
  ) {
    const { count, error: countError } = await marketingSchema(supabase)
      .from("content_assets")
      .select("id", { count: "exact", head: true })
      .eq("post_id", id);
    if (countError) return failSchedule(id, session.user.id, countError.message);
    if (post.content_type === "carrossel") {
      const carouselError = validateCarouselAssetCount(count ?? 0);
      if (carouselError) return failSchedule(id, session.user.id, carouselError);
    } else if (!count) {
      return failSchedule(id, session.user.id, "Adicione uma mídia antes de agendar");
    }
  }

  const { error } = await marketingSchema(supabase)
    .from("content_posts")
    .update({ status: "agendado" })
    .eq("id", id);

  if (error) return failSchedule(id, session.user.id, error.message);
  revalidateCalendar();
  return { ok: true };
}

export async function publishPostNowAction(id: string) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "update");
  try {
    await publishToMeta(id, session.user.id);
    revalidateCalendar();
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha na publicação" };
  }
}

export async function changePostStatusAction(id: string, toStatus: PostStatus) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "update");
  changeStatusSchema.parse({ id, to_status: toStatus });
  const supabase = await createClient();

  const { data: post } = await marketingSchema(supabase)
    .from("content_posts")
    .select("status")
    .eq("id", id)
    .single();

  if (!post) return { error: "Post não encontrado" };
  const from = post.status as PostStatus;
  if (!POST_STATUS_TRANSITIONS[from]?.includes(toStatus)) {
    return { error: "Transição de status inválida" };
  }

  const { error } = await marketingSchema(supabase)
    .from("content_posts")
    .update({ status: toStatus })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateCalendar();
  return { ok: true };
}

export async function reschedulePostAction(input: {
  id: string;
  scheduled_at: Date;
}): Promise<ScheduleResult> {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "update");
  const { id, scheduled_at } = reschedulePostSchema.parse(input);
  const supabase = await createClient();

  const { data: post } = await marketingSchema(supabase)
    .from("content_posts")
    .select("status")
    .eq("id", id)
    .single();

  if (!post) return { error: "Post não encontrado" };
  const blocked: PostStatus[] = ["publicando", "publicado", "falhou", "cancelado"];
  if (blocked.includes(post.status as PostStatus)) {
    return failSchedule(id, session.user.id, "Este post não pode ser reagendado");
  }

  const { error } = await marketingSchema(supabase)
    .from("content_posts")
    .update({ scheduled_at: scheduled_at.toISOString(), status: "agendado" })
    .eq("id", id);

  if (error) return failSchedule(id, session.user.id, error.message);
  revalidateCalendar();
  return { ok: true };
}

export async function deletePostAction(id: string) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "delete");
  const supabase = await createClient();

  const { data: post } = await marketingSchema(supabase)
    .from("content_posts")
    .select("status, external_post_id")
    .eq("id", id)
    .single();

  if (!post) return { error: "Post não encontrado" };

  if (post.status === "publicado" && post.external_post_id) {
    if (!hasMinRole(session.profile, "gestor")) {
      return { error: "Apenas gestor+ pode excluir posts publicados" };
    }
    try {
      await deleteMetaPost(id);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Falha ao excluir na Meta" };
    }
  }

  const { error } = await marketingSchema(supabase)
    .from("content_posts")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };

  await logAction({
    userId: session.user.id,
    action: "mkt.content_post.deleted",
    resourceType: "marketing.content_post",
    resourceId: id,
  });
  revalidateCalendar();
  return { ok: true };
}

export async function uploadAssetAction(postId: string, formData: FormData) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "create");
  const file = formData.get("file") as File | null;
  if (!file) return { error: "Arquivo não enviado" };

  const supabase = await createClient();
  const { data: post } = await marketingSchema(supabase)
    .from("content_posts")
    .select("content_type, platform_id")
    .eq("id", postId)
    .single();

  if (!post) return { error: "Post não encontrado" };
  const platformSlug = await getPlatformSlug(post.platform_id);
  const assetType = file.type.startsWith("video/") ? "video" : "image";
  const validation = validateAssetForPlatform(
    platformSlug,
    post.content_type as ContentType,
    { size: file.size, mimeType: file.type },
  );
  if (!validation.valid) return { error: validation.error };

  const assetId = crypto.randomUUID();
  const storagePath = `posts/${postId}/${assetId}-${file.name}`;
  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from(MARKETING_STORAGE_BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { data: assets } = await marketingSchema(supabase)
    .from("content_assets")
    .select("display_order")
    .eq("post_id", postId)
    .order("display_order", { ascending: false })
    .limit(1);

  const order = ((assets?.[0]?.display_order as number) ?? -1) + 1;

  const { data: asset, error } = await marketingSchema(supabase)
    .from("content_assets")
    .insert({
      post_id: postId,
      asset_type: assetType,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      display_order: order,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidateCalendar();
  return { data: asset };
}

export async function reorderAssetsAction(postId: string, orderedAssetIds: string[]) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "update");
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await marketingSchema(supabase)
    .from("content_assets")
    .select("id")
    .eq("post_id", postId);

  if (fetchError) return { error: fetchError.message };
  const existingIds = new Set((existing ?? []).map((a) => a.id as string));
  if (orderedAssetIds.length !== existingIds.size) {
    return { error: "Lista de mídias incompleta para reordenar" };
  }
  for (const id of orderedAssetIds) {
    if (!existingIds.has(id)) {
      return { error: "Mídia inválida para este post" };
    }
  }

  for (let i = 0; i < orderedAssetIds.length; i++) {
    const { error } = await marketingSchema(supabase)
      .from("content_assets")
      .update({ display_order: i })
      .eq("id", orderedAssetIds[i]!)
      .eq("post_id", postId);
    if (error) return { error: error.message };
  }

  revalidateCalendar();
  return { ok: true };
}

export async function deleteAssetAction(assetId: string) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "delete");
  const supabase = await createClient();
  const { data: asset } = await marketingSchema(supabase)
    .from("content_assets")
    .select("storage_path")
    .eq("id", assetId)
    .single();

  if (!asset) return { error: "Asset não encontrado" };

  const admin = createAdminClient();
  await admin.storage
    .from(MARKETING_STORAGE_BUCKET)
    .remove([asset.storage_path as string]);
  await marketingSchema(supabase).from("content_assets").delete().eq("id", assetId);
  revalidateCalendar();
  return { ok: true };
}

export async function createCampaignAction(input: CreateCampaignInput) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "create");
  const data = createCampaignSchema.parse(input);
  const supabase = await createClient();
  const payload = {
    ...data,
    start_date: data.start_date?.toISOString().slice(0, 10) ?? null,
    end_date: data.end_date?.toISOString().slice(0, 10) ?? null,
    created_by: session.user.id,
  };
  const { data: campaign, error } = await marketingSchema(supabase)
    .from("content_campaigns")
    .insert(payload)
    .select()
    .single();
  if (error) return { error: error.message };
  revalidateCalendar();
  revalidatePath("/modulos/marketing/calendario-conteudo/campanhas");
  return { data: campaign };
}

export async function addCommentAction(postId: string, body: string) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "create");
  if (!body.trim()) return { error: "Comentário vazio" };
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("content_comments")
    .insert({ post_id: postId, author_id: session.user.id, body: body.trim() })
    .select()
    .single();
  if (error) return { error: error.message };
  return { data };
}

