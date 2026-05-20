const GRAPH_VERSION = Deno.env.get("META_GRAPH_API_VERSION") ?? "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export type MetaCredentials = {
  app_id?: string;
  facebook_page_id?: string;
  instagram_user_id?: string;
  system_user_token_ref?: string;
};

export type PostForPublish = {
  id: string;
  content_type: string;
  copy: string | null;
  hashtags: string[] | null;
  cta_url: string | null;
  credential_id: string;
  platform: { slug: string };
  assets: Array<{ asset_type: string; storage_path: string }>;
  credentials: MetaCredentials;
};

export function formatCaption(copy: string | null, hashtags: string[] | null): string {
  const base = (copy ?? "").trim();
  const tags = (hashtags ?? [])
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean)
    .map((t) => `#${t}`);
  if (!tags.length) return base;
  if (!base) return tags.join(" ");
  return `${base}\n\n${tags.join(" ")}`;
}

async function metaPost<T>(
  path: string,
  token: string,
  body: Record<string, string>,
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString(), {
    method: "POST",
    body: new URLSearchParams(body),
  });
  const json = await res.json();
  if (!res.ok || (json as { error?: { message: string } }).error) {
    const msg =
      (json as { error?: { message: string } }).error?.message ?? res.statusText;
    throw new Error(msg);
  }
  return json as T;
}

async function metaGet<T>(
  path: string,
  token: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  url.searchParams.set("access_token", token);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  const json = await res.json();
  if (!res.ok || (json as { error?: { message: string } }).error) {
    const msg =
      (json as { error?: { message: string } }).error?.message ?? res.statusText;
    throw new Error(msg);
  }
  return json as T;
}

async function waitForContainer(containerId: string, token: string) {
  for (let i = 0; i < 30; i++) {
    const status = await metaGet<{ status_code?: string }>(`/${containerId}`, token, {
      fields: "status_code",
    });
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR")
      throw new Error("Instagram media processing failed");
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Instagram media processing timeout");
}

export async function publishToMetaApi(
  post: PostForPublish,
  token: string,
  mediaUrls: string[],
): Promise<{ id: string }> {
  const caption = formatCaption(post.copy, post.hashtags);
  const { slug } = post.platform;
  const creds = post.credentials;

  if (slug === "instagram") {
    const igId = creds.instagram_user_id!;
    switch (post.content_type) {
      case "imagem": {
        const container = await metaPost<{ id: string }>(`/${igId}/media`, token, {
          image_url: mediaUrls[0]!,
          caption,
        });
        await waitForContainer(container.id, token);
        return await metaPost<{ id: string }>(`/${igId}/media_publish`, token, {
          creation_id: container.id,
        });
      }
      case "video":
      case "reels": {
        const container = await metaPost<{ id: string }>(`/${igId}/media`, token, {
          media_type: post.content_type === "reels" ? "REELS" : "VIDEO",
          video_url: mediaUrls[0]!,
          caption,
        });
        await waitForContainer(container.id, token);
        return await metaPost<{ id: string }>(`/${igId}/media_publish`, token, {
          creation_id: container.id,
        });
      }
      case "carrossel": {
        const children: string[] = [];
        for (const url of mediaUrls) {
          const child = await metaPost<{ id: string }>(`/${igId}/media`, token, {
            image_url: url,
            is_carousel_item: "true",
          });
          children.push(child.id);
        }
        const container = await metaPost<{ id: string }>(`/${igId}/media`, token, {
          media_type: "CAROUSEL",
          children: children.join(","),
          caption,
        });
        return await metaPost<{ id: string }>(`/${igId}/media_publish`, token, {
          creation_id: container.id,
        });
      }
      default:
        throw new Error(`Unsupported Instagram type: ${post.content_type}`);
    }
  }

  if (slug === "facebook") {
    const pageId = creds.facebook_page_id!;
    switch (post.content_type) {
      case "imagem": {
        const result = await metaPost<{ id: string; post_id?: string }>(
          `/${pageId}/photos`,
          token,
          { url: mediaUrls[0]!, caption },
        );
        return { id: result.post_id ?? result.id };
      }
      case "video":
      case "reels":
        return await metaPost<{ id: string }>(`/${pageId}/videos`, token, {
          file_url: mediaUrls[0]!,
          description: caption,
        });
      case "texto":
        return await metaPost<{ id: string }>(`/${pageId}/feed`, token, {
          message: caption,
        });
      case "link":
        return await metaPost<{ id: string }>(`/${pageId}/feed`, token, {
          message: caption,
          link: post.cta_url ?? "",
        });
      default:
        throw new Error(`Unsupported Facebook type: ${post.content_type}`);
    }
  }

  throw new Error(`Unsupported platform: ${slug}`);
}
