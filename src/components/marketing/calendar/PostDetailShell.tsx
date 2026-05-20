"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PostForm } from "@/components/marketing/calendar/PostForm";
import { PostStatusBadge } from "@/components/marketing/calendar/PostStatusBadge";
import { PostDetailActions } from "@/components/marketing/calendar/PostDetailActions";
import { CONTENT_TYPE_LABELS } from "@/lib/constants/marketing";
import type { Platform, PostWithRelations } from "@/types/marketing";

type Props = {
  post: PostWithRelations;
  platforms: Platform[];
  campaigns: { id: string; name: string }[];
  credentials: { id: string; label: string; platform_id: string }[];
};

const EDITABLE_STATUSES = new Set(["agendado", "falhou"]);

export function PostDetailShell({ post, platforms, campaigns, credentials }: Props) {
  const [isEditing, setIsEditing] = useState(post.status === "rascunho");
  const [formKey, setFormKey] = useState(0);

  const canEnterEditMode = EDITABLE_STATUSES.has(post.status);
  const showEditButton = canEnterEditMode && !isEditing;
  const showCancelEdit = isEditing && post.status !== "rascunho";

  const helpText = isEditing
    ? "Edite o conteúdo à esquerda e confira a prévia da rede à direita."
    : "Visualize a publicação à esquerda e a prévia da rede à direita. Clique em Editar publicação para alterar.";

  function handleCancelEdit() {
    setFormKey((k) => k + 1);
    setIsEditing(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/modulos/marketing/calendario-conteudo"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar ao calendário
        </Link>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{post.title}</h1>
              <PostStatusBadge status={post.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {post.platform.name} · {CONTENT_TYPE_LABELS[post.content_type]} ·{" "}
              {new Date(post.scheduled_at).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showEditButton && (
              <Button type="button" onClick={() => setIsEditing(true)}>
                Editar publicação
              </Button>
            )}
            {showCancelEdit && (
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancelar edição
              </Button>
            )}
            <PostDetailActions post={post} compact />
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{helpText}</p>
      </div>

      <PostForm
        key={formKey}
        layout="compose"
        post={post}
        isEditing={isEditing}
        onCancelEdit={handleCancelEdit}
        cancelHref="/modulos/marketing/calendario-conteudo"
        platforms={platforms}
        campaigns={campaigns}
        credentials={credentials}
      />
    </div>
  );
}
