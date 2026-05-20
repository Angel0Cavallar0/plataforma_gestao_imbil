"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  changePostStatusAction,
  deletePostAction,
  publishPostNowAction,
  schedulePostAction,
} from "@/server/actions/marketing/content";
import { formatCaption } from "@/lib/marketing/caption";
import type { PostWithRelations } from "@/types/marketing";
import { toast } from "sonner";

export function PostDetailActions({ post }: { post: PostWithRelations }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const preview = formatCaption(post.copy, post.hashtags);

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="rounded-md border p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Legenda publicada
          </p>
          <p className="whitespace-pre-wrap text-sm">{preview}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {post.status === "rascunho" && (
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await schedulePostAction(post.id);
                if (res.error) toast.error(String(res.error));
                else {
                  toast.success("Agendado");
                  router.refresh();
                }
              })
            }
          >
            Agendar
          </Button>
        )}
        {(post.status === "agendado" || post.status === "falhou") && (
          <Button
            disabled={pending}
            onClick={() => {
              if (!confirm(`Publicar agora?\n\n${preview}`)) return;
              startTransition(async () => {
                const res = await publishPostNowAction(post.id);
                if (res.error) toast.error(String(res.error));
                else {
                  toast.success("Publicado");
                  router.refresh();
                }
              });
            }}
          >
            Publicar agora
          </Button>
        )}
        {post.status !== "cancelado" && post.status !== "publicado" && (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await changePostStatusAction(post.id, "cancelado");
                if (res.error) toast.error(String(res.error));
                else router.refresh();
              })
            }
          >
            Cancelar
          </Button>
        )}
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() => {
            if (!confirm("Excluir este post?")) return;
            startTransition(async () => {
              const res = await deletePostAction(post.id);
              if (res.error) toast.error(String(res.error));
              else {
                toast.success("Excluído");
                router.push("/modulos/marketing/calendario-conteudo");
              }
            });
          }}
        >
          Excluir
        </Button>
      </div>
    </div>
  );
}
