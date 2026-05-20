import { createAdminClient } from "@/lib/supabase/admin";
import { marketingSchema } from "@/lib/supabase/marketing";
import { MARKETING_STORAGE_BUCKET } from "@/lib/constants/marketing";
import { getMetaToken } from "@/lib/integrations/meta/credentials";
import { deleteFromMeta } from "@/lib/integrations/meta/delete";
import { editFacebookPostCaption } from "@/lib/integrations/meta/edit";
import { MetaApiError } from "@/lib/integrations/meta/errors";
import {
  publishCarouselIG,
  publishImageIG,
  publishReelIG,
  publishStoryIG,
  publishVideoIG,
} from "@/lib/integrations/meta/instagram";
import {
  publishImageFB,
  publishLinkFB,
  publishReelFB,
  publishTextFB,
  publishVideoFB,
} from "@/lib/integrations/meta/facebook";
import type { MetaCredentials, PostForPublish } from "@/lib/integrations/meta/types";
import type { MetaCredentialsJson } from "@/types/marketing";

const SIGNED_URL_TTL_SEC = 15 * 60;

async function getSignedMediaUrl(storagePath: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(MARKETING_STORAGE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SEC);
  if (error || !data?.signedUrl)
    throw new Error("Não foi possível gerar URL assinada da mídia");
  return data.signedUrl;
}

async function fetchPostForPublish(postId: string): Promise<PostForPublish> {
  const admin = createAdminClient();
  const { data, error } = await marketingSchema(admin)
    .from("content_posts")
    .select(
      `*,
      platform:platforms(slug),
      assets:content_assets(*),
      credential:integration_credentials(credentials)
    `,
    )
    .eq("id", postId)
    .single();

  if (error || !data) throw new Error("Post não encontrado");
  if (!data.credential_id) throw new Error("Conta Meta não vinculada ao post");

  const credRow = data.credential as { credentials: MetaCredentialsJson } | null;
  const credentials = (credRow?.credentials ?? {}) as MetaCredentials;

  return {
    id: data.id,
    content_type: data.content_type,
    copy: data.copy,
    hashtags: data.hashtags,
    cta_url: data.cta_url,
    credential_id: data.credential_id,
    platform: data.platform as { slug: string },
    assets: (data.assets ?? []) as PostForPublish["assets"],
    credentials,
  };
}

export async function publishToMeta(postId: string, userId: string): Promise<void> {
  const admin = createAdminClient();
  const post = await fetchPostForPublish(postId);

  if (post.platform.slug === "instagram" && !post.credentials.instagram_user_id) {
    throw new Error("Instagram User ID não configurado");
  }
  if (post.platform.slug === "facebook" && !post.credentials.facebook_page_id) {
    throw new Error("Facebook Page ID não configurado");
  }

  await marketingSchema(admin)
    .from("content_posts")
    .update({ status: "publicando" })
    .eq("id", postId);

  const token = await getMetaToken(post.credential_id!);

  try {
    let result: { id: string; permalink_url?: string };
    const platform = post.platform.slug;
    const urls = await Promise.all(
      post.assets.map((a) => getSignedMediaUrl(a.storage_path)),
    );

    if (platform === "instagram") {
      switch (post.content_type) {
        case "imagem":
          result = await publishImageIG(post, token, urls[0]!);
          break;
        case "video":
          result = await publishVideoIG(post, token, urls[0]!);
          break;
        case "reels":
          result = await publishReelIG(post, token, urls[0]!);
          break;
        case "carrossel":
          result = await publishCarouselIG(post, token, urls);
          break;
        case "story": {
          const isVideo = post.assets[0]?.asset_type === "video";
          result = await publishStoryIG(post, token, urls[0]!, isVideo);
          break;
        }
        default:
          throw new Error(`Tipo ${post.content_type} não suportado no Instagram`);
      }
    } else if (platform === "facebook") {
      switch (post.content_type) {
        case "imagem":
          result = await publishImageFB(post, token, urls[0]!);
          break;
        case "video":
          result = await publishVideoFB(post, token, urls[0]!);
          break;
        case "reels":
          result = await publishReelFB(post, token, urls[0]!);
          break;
        case "texto":
          result = await publishTextFB(post, token);
          break;
        case "link":
          result = await publishLinkFB(post, token);
          break;
        default:
          throw new Error(`Tipo ${post.content_type} não suportado no Facebook`);
      }
    } else {
      throw new Error(`Plataforma ${platform} não suportada para publicação`);
    }

    await marketingSchema(admin)
      .from("content_posts")
      .update({
        status: "publicado",
        published_at: new Date().toISOString(),
        external_post_id: result.id,
        external_post_url: result.permalink_url ?? null,
        last_error_message: null,
        last_error_code: null,
      })
      .eq("id", postId);

    const { logAction } = await import("@/lib/auth/audit");
    await logAction({
      userId,
      action: "mkt.content_post.published",
      resourceType: "marketing.content_post",
      resourceId: postId,
      metadata: { external_post_id: result.id, platform },
    });
  } catch (err) {
    const parsed = err instanceof MetaApiError ? err.parsed : null;
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    const code = parsed?.code ?? null;

    const { data: row } = await marketingSchema(admin)
      .from("content_posts")
      .select("publish_attempts")
      .eq("id", postId)
      .single();

    await marketingSchema(admin)
      .from("content_posts")
      .update({
        status: "falhou",
        publish_attempts: (row?.publish_attempts ?? 0) + 1,
        last_error_message: message,
        last_error_code: code,
        last_error_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (parsed?.shouldInvalidateCredential && post.credential_id) {
      await marketingSchema(admin)
        .from("integration_credentials")
        .update({ is_active: false })
        .eq("id", post.credential_id);
    }

    const { logAction } = await import("@/lib/auth/audit");
    await logAction({
      userId,
      action: "mkt.content_post.publish_failed",
      resourceType: "marketing.content_post",
      resourceId: postId,
      metadata: { code, message },
    });
    throw err;
  }
}

export async function editMetaPost(
  postId: string,
  copy: string | null,
  hashtags: string[] | null,
): Promise<void> {
  const admin = createAdminClient();
  const { data } = await marketingSchema(admin)
    .from("content_posts")
    .select("external_post_id, credential_id, status, platform:platforms(slug)")
    .eq("id", postId)
    .single();

  if (!data?.external_post_id || data.status !== "publicado") return;
  const platform = data.platform as unknown as { slug: string };
  if (platform.slug !== "facebook") {
    throw new Error("Apenas posts do Facebook permitem edição de legenda via API");
  }
  const token = await getMetaToken(data.credential_id!);
  await editFacebookPostCaption(data.external_post_id, token, copy, hashtags);
}

export async function deleteMetaPost(postId: string): Promise<void> {
  const admin = createAdminClient();
  const { data } = await marketingSchema(admin)
    .from("content_posts")
    .select("external_post_id, credential_id, status")
    .eq("id", postId)
    .single();
  if (!data?.external_post_id || data.status !== "publicado") return;
  const token = await getMetaToken(data.credential_id!);
  await deleteFromMeta(data.external_post_id, token);
}
