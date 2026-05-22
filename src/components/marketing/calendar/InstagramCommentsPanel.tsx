"use client";

import { useEffect, useState } from "react";
import { fetchInstagramMediaCommentsAction } from "@/server/actions/marketing/instagram-comments";
import type { InstagramMediaComment } from "@/types/marketing";

function CommentItem({
  comment,
  depth = 0,
}: {
  comment: InstagramMediaComment;
  depth?: number;
}) {
  const username = comment.username ?? comment.from?.username ?? "usuário";
  const date = comment.timestamp
    ? new Date(comment.timestamp).toLocaleString("pt-BR")
    : "";

  return (
    <div className={depth > 0 ? "ml-4 border-l pl-3" : ""}>
      <div className="rounded-md border bg-muted/30 p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">@{username}</span>
          {date && <span>{date}</span>}
          {comment.like_count != null && comment.like_count > 0 && (
            <span>{comment.like_count} curtida(s)</span>
          )}
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm">{comment.text}</p>
      </div>
      {comment.replies?.map((reply) => (
        <div key={reply.id} className="mt-2">
          <CommentItem comment={reply} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}

export function InstagramCommentsPanel({ mediaId }: { mediaId: string }) {
  const [comments, setComments] = useState<InstagramMediaComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchInstagramMediaCommentsAction(mediaId).then((res) => {
      if (cancelled) return;
      if (res.error) {
        setError(res.error);
        setComments([]);
      } else {
        setComments(res.data ?? []);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [mediaId]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Comentários (Instagram)</h3>
      {loading && (
        <p className="text-sm text-muted-foreground">Carregando comentários…</p>
      )}
      {error && !loading && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {!loading && !error && comments.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum comentário nesta publicação.
        </p>
      )}
      {!loading && !error && comments.length > 0 && (
        <ul className="max-h-80 space-y-3 overflow-y-auto">
          {comments.map((c) => (
            <li key={c.id}>
              <CommentItem comment={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
