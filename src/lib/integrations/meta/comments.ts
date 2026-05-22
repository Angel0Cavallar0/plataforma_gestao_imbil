import { metaGet } from "@/lib/integrations/meta/client";
import type { InstagramMediaComment } from "@/types/marketing";

type GraphCommentFrom = { id: string; username?: string };
type GraphCommentNode = {
  id: string;
  text?: string;
  timestamp?: string;
  like_count?: number;
  username?: string;
  from?: GraphCommentFrom;
  replies?: { data?: GraphCommentNode[] };
};

type GraphCommentsResponse = {
  data?: GraphCommentNode[];
};

function mapComment(node: GraphCommentNode): InstagramMediaComment {
  return {
    id: node.id,
    text: node.text ?? "",
    timestamp: node.timestamp ?? "",
    like_count: node.like_count,
    username: node.username ?? node.from?.username,
    from: node.from ? { id: node.from.id, username: node.from.username } : undefined,
    replies: node.replies?.data?.map(mapComment),
  };
}

export async function fetchInstagramMediaComments(
  mediaId: string,
  token: string,
): Promise<InstagramMediaComment[]> {
  const res = await metaGet<GraphCommentsResponse>(`/${mediaId}/comments`, token, {
    fields:
      "id,text,timestamp,like_count,username,from{id,username},replies{id,text,timestamp,like_count,username,from{id,username}}",
  });
  return (res.data ?? []).map(mapComment);
}
