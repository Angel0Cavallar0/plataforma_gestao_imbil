import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { publishToMetaApi, type MetaCredentials, type PostForPublish } from "./meta.ts";

const BUCKET = "marketing-content-assets";
const MAX_ATTEMPTS = 3;
const SIGNED_URL_TTL = 15 * 60;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isAuthorized(req: Request): boolean {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const auth = req.headers.get("Authorization") ?? "";
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;

  // Invocação interna do pg_cron com service role
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && auth === `Bearer ${serviceKey}`) return true;

  return false;
}

async function getMetaToken(
  supabase: ReturnType<typeof createClient>,
  credentialId: string,
  credentials: MetaCredentials,
): Promise<string> {
  const ref = credentials.system_user_token_ref;
  if (!ref) throw new Error("Token Meta não configurado");
  const secretName = ref.replace(/^vault:/, "");
  const { data, error } = await supabase.schema("marketing").rpc("read_vault_secret", {
    p_name: secretName,
  });
  if (error || !data) throw new Error("Não foi possível ler o token do Vault");
  await supabase
    .schema("marketing")
    .from("integration_credentials")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", credentialId);
  return data as string;
}

async function publishPost(
  supabase: ReturnType<typeof createClient>,
  postId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase
    .schema("marketing")
    .from("content_posts")
    .select(
      `*,
      platform:platforms(slug),
      assets:content_assets(storage_path, asset_type, display_order),
      credential:integration_credentials(credentials, is_active)
    `,
    )
    .eq("id", postId)
    .single();

  if (error || !data) return { ok: false, error: "Post não encontrado" };
  if (!data.credential_id) return { ok: false, error: "Credencial não vinculada" };

  const credRow = data.credential as {
    credentials: MetaCredentials;
    is_active: boolean;
  } | null;
  if (!credRow?.is_active) return { ok: false, error: "Credencial inativa" };

  const platformRaw = data.platform as { slug: string } | { slug: string }[];
  const platform = Array.isArray(platformRaw) ? platformRaw[0] : platformRaw;
  const credentials = credRow.credentials;

  const assetsRaw = (data.assets ?? []) as Array<{
    storage_path: string;
    asset_type: string;
    display_order?: number;
  }>;
  const sortedAssets = [...assetsRaw].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
  );

  const post: PostForPublish = {
    id: data.id,
    content_type: data.content_type,
    copy: data.copy,
    hashtags: data.hashtags,
    cta_url: data.cta_url,
    credential_id: data.credential_id,
    platform: { slug: platform?.slug ?? "" },
    assets: sortedAssets as PostForPublish["assets"],
    credentials,
  };

  await supabase
    .schema("marketing")
    .from("content_posts")
    .update({ status: "publicando" })
    .eq("id", postId);

  try {
    const token = await getMetaToken(supabase, data.credential_id, credentials);
    const mediaUrls: string[] = [];
    for (const asset of post.assets) {
      const { data: signed, error: signErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(asset.storage_path, SIGNED_URL_TTL);
      if (signErr || !signed?.signedUrl) {
        throw new Error("Falha ao gerar URL assinada da mídia");
      }
      mediaUrls.push(signed.signedUrl);
    }

    const result = await publishToMetaApi(post, token, mediaUrls);

    await supabase
      .schema("marketing")
      .from("content_posts")
      .update({
        status: "publicado",
        published_at: new Date().toISOString(),
        external_post_id: result.id,
        last_error_message: null,
        last_error_code: null,
      })
      .eq("id", postId);

    await supabase.from("audit_logs").insert({
      action: "mkt.content_post.published",
      resource_type: "marketing.content_post",
      resource_id: postId,
      metadata: { external_post_id: result.id, source: "edge_cron" },
    });

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    const { data: row } = await supabase
      .schema("marketing")
      .from("content_posts")
      .select("publish_attempts")
      .eq("id", postId)
      .single();

    await supabase
      .schema("marketing")
      .from("content_posts")
      .update({
        status: "falhou",
        publish_attempts: (row?.publish_attempts ?? 0) + 1,
        last_error_message: message,
        last_error_at: new Date().toISOString(),
      })
      .eq("id", postId);

    await supabase.from("audit_logs").insert({
      action: "mkt.content_post.publish_failed",
      resource_type: "marketing.content_post",
      resource_id: postId,
      metadata: { message, source: "edge_cron" },
    });

    return { ok: false, error: message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  if (!isAuthorized(req)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "Supabase env missing" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date().toISOString();
  const { data: posts, error } = await supabase
    .schema("marketing")
    .from("content_posts")
    .select("id, publish_attempts")
    .eq("status", "agendado")
    .lte("scheduled_at", now);

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const post of posts ?? []) {
    if ((post.publish_attempts as number) >= MAX_ATTEMPTS) continue;
    const result = await publishPost(supabase, post.id as string);
    results.push({ id: post.id as string, ...result });
  }

  return jsonResponse({ processed: results.length, results });
});
