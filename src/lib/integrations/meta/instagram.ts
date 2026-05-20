import { metaGet, metaPost } from "@/lib/integrations/meta/client";
import { formatCaption } from "@/lib/marketing/caption";
import type { MetaPublishResult, PostForPublish } from "@/lib/integrations/meta/types";

async function waitForContainer(igUserId: string, containerId: string, token: string) {
  for (let i = 0; i < 30; i++) {
    const status = await metaGet<{ status_code?: string }>(`/${containerId}`, token, {
      fields: "status_code",
    });
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR")
      throw new Error("Processamento de mídia falhou no Instagram");
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Timeout aguardando processamento Instagram");
}

export async function publishImageIG(
  post: PostForPublish,
  token: string,
  mediaUrl: string,
): Promise<MetaPublishResult> {
  const creds = post.credentials;
  const caption = formatCaption(post.copy, post.hashtags);
  const container = await metaPost<{ id: string }>(
    `/${creds.instagram_user_id}/media`,
    token,
    {
      image_url: mediaUrl,
      caption,
    },
  );
  await waitForContainer(creds.instagram_user_id, container.id, token);
  const published = await metaPost<{ id: string }>(
    `/${creds.instagram_user_id}/media_publish`,
    token,
    { creation_id: container.id },
  );
  return { id: published.id };
}

export async function publishVideoIG(
  post: PostForPublish,
  token: string,
  mediaUrl: string,
): Promise<MetaPublishResult> {
  const creds = post.credentials;
  const caption = formatCaption(post.copy, post.hashtags);
  const container = await metaPost<{ id: string }>(
    `/${creds.instagram_user_id}/media`,
    token,
    {
      media_type: "VIDEO",
      video_url: mediaUrl,
      caption,
    },
  );
  await waitForContainer(creds.instagram_user_id, container.id, token);
  const published = await metaPost<{ id: string }>(
    `/${creds.instagram_user_id}/media_publish`,
    token,
    { creation_id: container.id },
  );
  return { id: published.id };
}

export async function publishReelIG(
  post: PostForPublish,
  token: string,
  mediaUrl: string,
): Promise<MetaPublishResult> {
  const creds = post.credentials;
  const caption = formatCaption(post.copy, post.hashtags);
  const container = await metaPost<{ id: string }>(
    `/${creds.instagram_user_id}/media`,
    token,
    {
      media_type: "REELS",
      video_url: mediaUrl,
      caption,
    },
  );
  await waitForContainer(creds.instagram_user_id, container.id, token);
  const published = await metaPost<{ id: string }>(
    `/${creds.instagram_user_id}/media_publish`,
    token,
    { creation_id: container.id },
  );
  return { id: published.id };
}

export async function publishCarouselIG(
  post: PostForPublish,
  token: string,
  mediaUrls: string[],
): Promise<MetaPublishResult> {
  const creds = post.credentials;
  const caption = formatCaption(post.copy, post.hashtags);
  const children: string[] = [];
  for (const url of mediaUrls) {
    const child = await metaPost<{ id: string }>(
      `/${creds.instagram_user_id}/media`,
      token,
      {
        image_url: url,
        is_carousel_item: "true",
      },
    );
    children.push(child.id);
  }
  const container = await metaPost<{ id: string }>(
    `/${creds.instagram_user_id}/media`,
    token,
    {
      media_type: "CAROUSEL",
      children: children.join(","),
      caption,
    },
  );
  const published = await metaPost<{ id: string }>(
    `/${creds.instagram_user_id}/media_publish`,
    token,
    { creation_id: container.id },
  );
  return { id: published.id };
}

export async function publishStoryIG(
  post: PostForPublish,
  token: string,
  mediaUrl: string,
  isVideo: boolean,
): Promise<MetaPublishResult> {
  const creds = post.credentials;
  const body: Record<string, string> = isVideo
    ? { media_type: "STORIES", video_url: mediaUrl }
    : { media_type: "STORIES", image_url: mediaUrl };
  const container = await metaPost<{ id: string }>(
    `/${creds.instagram_user_id}/media`,
    token,
    body,
  );
  if (isVideo) await waitForContainer(creds.instagram_user_id, container.id, token);
  const published = await metaPost<{ id: string }>(
    `/${creds.instagram_user_id}/media_publish`,
    token,
    { creation_id: container.id },
  );
  return { id: published.id };
}
