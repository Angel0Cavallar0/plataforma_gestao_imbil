import { metaPost } from "@/lib/integrations/meta/client";
import { formatCaption } from "@/lib/marketing/caption";
import type { MetaPublishResult, PostForPublish } from "@/lib/integrations/meta/types";

export async function publishImageFB(
  post: PostForPublish,
  token: string,
  mediaUrl: string,
): Promise<MetaPublishResult> {
  const pageId = post.credentials.facebook_page_id;
  const caption = formatCaption(post.copy, post.hashtags);
  const result = await metaPost<{ id: string; post_id?: string }>(
    `/${pageId}/photos`,
    token,
    {
      url: mediaUrl,
      caption,
    },
  );
  return { id: result.post_id ?? result.id };
}

export async function publishVideoFB(
  post: PostForPublish,
  token: string,
  mediaUrl: string,
): Promise<MetaPublishResult> {
  const pageId = post.credentials.facebook_page_id;
  const description = formatCaption(post.copy, post.hashtags);
  const result = await metaPost<{ id: string }>(`/${pageId}/videos`, token, {
    file_url: mediaUrl,
    description,
  });
  return { id: result.id };
}

export async function publishTextFB(
  post: PostForPublish,
  token: string,
): Promise<MetaPublishResult> {
  const pageId = post.credentials.facebook_page_id;
  const message = formatCaption(post.copy, post.hashtags);
  const result = await metaPost<{ id: string }>(`/${pageId}/feed`, token, { message });
  return { id: result.id };
}

export async function publishLinkFB(
  post: PostForPublish,
  token: string,
): Promise<MetaPublishResult> {
  const pageId = post.credentials.facebook_page_id;
  const message = formatCaption(post.copy, post.hashtags);
  const link = post.cta_url ?? "";
  const result = await metaPost<{ id: string }>(`/${pageId}/feed`, token, {
    message,
    link,
  });
  return { id: result.id };
}

export async function publishReelFB(
  post: PostForPublish,
  token: string,
  mediaUrl: string,
): Promise<MetaPublishResult> {
  return publishVideoFB(post, token, mediaUrl);
}

/** Carrossel multi-foto: fotos não publicadas + post no feed com attached_media. */
export async function publishCarouselFB(
  post: PostForPublish,
  token: string,
  mediaUrls: string[],
): Promise<MetaPublishResult> {
  const pageId = post.credentials.facebook_page_id;
  const message = formatCaption(post.copy, post.hashtags);
  const photoIds: string[] = [];

  for (const url of mediaUrls) {
    const photo = await metaPost<{ id: string }>(`/${pageId}/photos`, token, {
      url,
      published: "false",
    });
    photoIds.push(photo.id);
  }

  const attachedMedia = photoIds.map((id) => ({ media_fbid: id }));
  const result = await metaPost<{ id: string }>(`/${pageId}/feed`, token, {
    message,
    attached_media: JSON.stringify(attachedMedia),
  });
  return { id: result.id };
}
