import { metaDelete } from "@/lib/integrations/meta/client";

export async function deleteFromMeta(
  externalPostId: string,
  token: string,
): Promise<void> {
  await metaDelete(`/${externalPostId}`, token);
}
