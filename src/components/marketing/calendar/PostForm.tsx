"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTENT_TYPE_LABELS,
  CONTENT_TYPES,
  COPY_MAX_LENGTH,
} from "@/lib/constants/marketing";
import { captionLength, formatCaption } from "@/lib/marketing/caption";
import {
  createPostAction,
  schedulePostAction,
  updatePostAction,
  uploadAssetAction,
} from "@/server/actions/marketing/content";
import type { ContentType, Platform, PostWithRelations } from "@/types/marketing";
import { toast } from "sonner";

type Props = {
  platforms: Platform[];
  campaigns: { id: string; name: string }[];
  credentials: { id: string; label: string; platform_id: string }[];
  post?: PostWithRelations;
};

export function PostForm({ platforms, campaigns, credentials, post }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copy, setCopy] = useState(post?.copy ?? "");
  const [hashtagsRaw, setHashtagsRaw] = useState((post?.hashtags ?? []).join(", "));
  const [platformId, setPlatformId] = useState(
    post?.platform_id ?? platforms[0]?.id ?? "",
  );
  const [contentType, setContentType] = useState<ContentType>(
    post?.content_type ?? "imagem",
  );

  const hashtags = useMemo(
    () =>
      hashtagsRaw
        .split(/[,\s]+/)
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean),
    [hashtagsRaw],
  );

  const finalLength = captionLength(copy, hashtags);
  const preview = formatCaption(copy, hashtags);
  const platform = platforms.find((p) => p.id === platformId);
  const isIgPublished =
    post?.status === "publicado" && post.platform.slug === "instagram";

  const filteredCredentials = credentials.filter((c) => c.platform_id === platformId);

  function buildPayload(form: FormData) {
    return {
      title: String(form.get("title")),
      platform_id: platformId,
      credential_id: String(form.get("credential_id") || "") || undefined,
      campaign_id: String(form.get("campaign_id") || "") || null,
      content_type: contentType,
      copy: copy || undefined,
      hashtags,
      cta_url: String(form.get("cta_url") || ""),
      scheduled_at: new Date(String(form.get("scheduled_at"))),
      assigned_to: null,
    };
  }

  async function handleSubmit(form: FormData, schedule: boolean) {
    startTransition(async () => {
      const payload = buildPayload(form);
      if (finalLength > COPY_MAX_LENGTH) {
        toast.error(`Legenda excede ${COPY_MAX_LENGTH} caracteres`);
        return;
      }

      let postId = post?.id;
      if (post) {
        const res = await updatePostAction({ id: post.id, ...payload });
        if (res.error) {
          toast.error(typeof res.error === "string" ? res.error : "Erro ao salvar");
          return;
        }
        postId = post.id;
      } else {
        const res = await createPostAction(payload);
        if (res.error) {
          toast.error(typeof res.error === "string" ? res.error : "Erro ao criar");
          return;
        }
        postId = res.data?.id as string;
      }

      const file = form.get("file") as File | null;
      if (file?.size && postId) {
        const fd = new FormData();
        fd.set("file", file);
        const up = await uploadAssetAction(postId, fd);
        if (up.error) toast.error(String(up.error));
      }

      if (schedule && postId) {
        const sched = await schedulePostAction(postId);
        if (sched.error) toast.error(String(sched.error));
        else toast.success("Post agendado");
      } else {
        toast.success("Rascunho salvo");
      }

      router.push(`/modulos/marketing/calendario-conteudo/${postId}`);
      router.refresh();
    });
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(new FormData(e.currentTarget), false);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Título interno</Label>
          <Input
            id="title"
            name="title"
            required
            minLength={3}
            defaultValue={post?.title}
            placeholder="Ex: Lançamento linha X — feed IG"
          />
        </div>

        <div className="space-y-2">
          <Label>Plataforma</Label>
          <Select value={platformId} onChange={(e) => setPlatformId(e.target.value)}>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tipo de conteúdo</Label>
          <Select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as ContentType)}
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {CONTENT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="credential_id">Conta Meta</Label>
          <Select
            id="credential_id"
            name="credential_id"
            defaultValue={post?.credential_id ?? ""}
          >
            <option value="">Selecione…</option>
            {filteredCredentials.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaign_id">Campanha (opcional)</Label>
          <Select
            id="campaign_id"
            name="campaign_id"
            defaultValue={post?.campaign_id ?? ""}
          >
            <option value="">Nenhuma</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduled_at">Data e hora</Label>
          <Input
            id="scheduled_at"
            name="scheduled_at"
            type="datetime-local"
            required
            defaultValue={
              post?.scheduled_at
                ? new Date(post.scheduled_at).toISOString().slice(0, 16)
                : ""
            }
          />
        </div>

        {(contentType === "link" || platform?.slug === "facebook") && (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cta_url">URL do link (Facebook)</Label>
            <Input
              id="cta_url"
              name="cta_url"
              type="url"
              defaultValue={post?.cta_url ?? ""}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="copy">Legenda / descrição</Label>
          <span
            className={
              finalLength > COPY_MAX_LENGTH
                ? "text-destructive text-xs"
                : "text-muted-foreground text-xs"
            }
          >
            {finalLength}/{COPY_MAX_LENGTH}
          </span>
        </div>
        <Textarea
          id="copy"
          name="copy"
          rows={6}
          value={copy}
          disabled={isIgPublished}
          onChange={(e) => setCopy(e.target.value)}
          placeholder="Texto que será publicado na rede social…"
        />
        {isIgPublished && (
          <p className="text-xs text-muted-foreground">
            Posts do Instagram publicados não permitem edição de legenda via API.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="hashtags">Hashtags (separadas por vírgula)</Label>
        <Input
          id="hashtags"
          value={hashtagsRaw}
          onChange={(e) => setHashtagsRaw(e.target.value)}
          placeholder="imbil, marketing, novidade"
        />
      </div>

      {preview && (
        <div className="rounded-md border bg-muted/40 p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Prévia da publicação
          </p>
          <p className="whitespace-pre-wrap text-sm">{preview}</p>
        </div>
      )}

      {contentType !== "texto" && (
        <div className="space-y-2">
          <Label htmlFor="file">Mídia</Label>
          <Input
            id="file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,video/mp4,video/quicktime"
          />
          {post?.assets?.length ? (
            <ul className="text-xs text-muted-foreground">
              {post.assets.map((a) => (
                <li key={a.id}>
                  {a.file_name} ({a.asset_type})
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          Salvar rascunho
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={(e) => {
            const form = (e.target as HTMLElement).closest("form");
            if (!form) return;
            handleSubmit(new FormData(form), true);
          }}
        >
          Agendar
        </Button>
      </div>
    </form>
  );
}
