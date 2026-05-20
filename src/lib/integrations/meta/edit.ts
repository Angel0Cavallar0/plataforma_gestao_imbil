import { metaPost } from "@/lib/integrations/meta/client";
import { formatCaption } from "@/lib/marketing/caption";

export async function editFacebookPostCaption(
  externalPostId: string,
  token: string,
  copy: string | null,
  hashtags: string[] | null,
): Promise<void> {
  const message = formatCaption(copy, hashtags);
  await metaPost(`/${externalPostId}`, token, { message });
}
