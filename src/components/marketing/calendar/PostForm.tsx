"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CONTENT_TYPE_LABELS,
  CONTENT_TYPES,
  COPY_MAX_LENGTH,
} from "@/lib/constants/marketing";
import { captionLength, formatCaption } from "@/lib/marketing/caption";
import {
  createPostAction,
  createPostsBatchAction,
  schedulePostAction,
  updatePostAction,
  uploadAssetAction,
} from "@/server/actions/marketing/content";
import { PostPreviewPanel } from "@/components/marketing/calendar/PostPreviewPanel";
import { CampaignPickerDialog } from "@/components/marketing/calendar/CampaignPickerDialog";
import type { CreatePostInput } from "@/lib/validations/marketing/content";
import type { ContentType, Platform, PostWithRelations } from "@/types/marketing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CreatableContentType = CreatePostInput["content_type"];

function toCreatableContentType(value: ContentType | undefined): CreatableContentType {
  if (
    value === "imagem" ||
    value === "video" ||
    value === "carrossel" ||
    value === "reels" ||
    value === "story"
  ) {
    return value;
  }
  return "imagem";
}

function assetPreviewUrl(asset: PostWithRelations["assets"][0] | undefined) {
  if (!asset) return null;
  return asset.preview_url ?? asset.public_url ?? null;
}

type Props = {
  platforms: Platform[];
  campaigns: { id: string; name: string }[];
  credentials: { id: string; label: string; platform_id: string }[];
  post?: PostWithRelations;
  layout?: "default" | "compose";
  cancelHref?: string;
  /** When editing an existing post; defaults to true for new posts. */
  isEditing?: boolean;
  onCancelEdit?: () => void;
};

export function PostForm({
  platforms,
  campaigns: initialCampaigns,
  credentials,
  post,
  layout = "default",
  cancelHref = "/modulos/marketing/calendario-conteudo",
  isEditing: isEditingProp,
  onCancelEdit,
}: Props) {
  const router = useRouter();
  const showPreviewPanel = layout === "compose";
  const isNewCompose = showPreviewPanel && !post;
  const isEditing = isEditingProp ?? !post;
  const readOnly = !!post && !isEditing;
  const [pending, startTransition] = useTransition();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [campaignId, setCampaignId] = useState<string | null>(post?.campaign_id ?? null);
  const [copy, setCopy] = useState(post?.copy ?? "");
  const [hashtagsRaw, setHashtagsRaw] = useState((post?.hashtags ?? []).join(", "));
  const [platformId, setPlatformId] = useState(
    post?.platform_id ?? platforms[0]?.id ?? "",
  );
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>(() =>
    platforms.map((p) => p.id),
  );
  const [metaCredentialId, setMetaCredentialId] = useState(post?.credential_id ?? "");
  const [contentType, setContentType] = useState<CreatableContentType>(
    toCreatableContentType(post?.content_type),
  );
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | undefined>();
  const existingAssetUrl = assetPreviewUrl(post?.assets?.[0]);
  const mediaPreviewUrl = filePreviewUrl ?? existingAssetUrl;
  const mediaMimeType = fileMimeType ?? post?.assets?.[0]?.mime_type ?? undefined;
  const [isDirty, setIsDirty] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

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

  const selectedPlatforms = useMemo(
    () => platforms.filter((p) => selectedPlatformIds.includes(p.id)),
    [platforms, selectedPlatformIds],
  );

  const previewPlatforms = useMemo(
    () =>
      (isNewCompose ? selectedPlatforms : platform ? [platform] : []).map((p) => ({
        slug: p.slug,
        name: p.name,
      })),
    [isNewCompose, selectedPlatforms, platform],
  );

  const instagramPlatformId = useMemo(
    () => platforms.find((p) => p.slug === "instagram")?.id,
    [platforms],
  );

  /** Credenciais Meta (cadastradas no módulo Instagram; IDs servem IG + Facebook). */
  const metaCredentials = useMemo(() => {
    if (instagramPlatformId) {
      return credentials.filter((c) => c.platform_id === instagramPlatformId);
    }
    return credentials;
  }, [credentials, instagramPlatformId]);

  const contentTypeOptions = useMemo(() => {
    const types = [...CONTENT_TYPES];
    if (
      post?.content_type &&
      (post.content_type === "texto" || post.content_type === "link") &&
      !types.includes(post.content_type)
    ) {
      types.push(post.content_type);
    }
    return types;
  }, [post]);

  const accountLabel = useMemo(() => {
    const credId = metaCredentialId || post?.credential_id;
    return credentials.find((c) => c.id === credId)?.label;
  }, [metaCredentialId, credentials, post?.credential_id]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const fieldDisabled = readOnly || isIgPublished;

  function markDirty() {
    if (!isDirty) setIsDirty(true);
  }

  function togglePlatform(id: string) {
    markDirty();
    setSelectedPlatformIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) {
          toast.error("Selecione ao menos uma rede social");
          return prev;
        }
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }

  function buildSharedPayload(form: FormData) {
    return {
      title: String(form.get("title")),
      campaign_id: campaignId,
      content_type: contentType,
      copy: copy || undefined,
      hashtags,
      cta_url: "",
      scheduled_at: new Date(String(form.get("scheduled_at"))),
      assigned_to: null,
    };
  }

  function buildPayload(form: FormData, targetPlatformId: string) {
    const credId = metaCredentialId || String(form.get("credential_id") || "");
    return {
      ...buildSharedPayload(form),
      platform_id: targetPlatformId,
      credential_id: credId || undefined,
    };
  }

  async function handleSubmit(form: FormData, schedule: boolean) {
    startTransition(async () => {
      if (finalLength > COPY_MAX_LENGTH) {
        toast.error(`Legenda excede ${COPY_MAX_LENGTH} caracteres`);
        return;
      }

      if (isNewCompose) {
        if (!selectedPlatformIds.length) {
          toast.error("Selecione ao menos uma rede social");
          return;
        }
        const posts = selectedPlatformIds.map((pid) => buildPayload(form, pid));
        const res = await createPostsBatchAction({ posts, schedule });
        if (res.error) {
          toast.error(typeof res.error === "string" ? res.error : "Erro ao criar");
          return;
        }
        if (res.partialErrors?.length) {
          toast.warning(res.partialErrors.join("; "));
        }

        const file = form.get("file") as File | null;
        const ids = res.data?.ids ?? [];
        if (file?.size && ids.length) {
          for (const postId of ids) {
            const fd = new FormData();
            fd.set("file", file);
            const up = await uploadAssetAction(postId, fd);
            if (up.error) toast.error(String(up.error));
          }
        }

        toast.success(
          schedule
            ? `${ids.length} post(s) agendado(s)`
            : `${ids.length} rascunho(s) salvo(s)`,
        );
        router.push("/modulos/marketing/calendario-conteudo");
        router.refresh();
        return;
      }

      const payload = buildPayload(form, platformId);
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

      if (post && post.status !== "rascunho" && onCancelEdit) {
        router.refresh();
        onCancelEdit();
      } else {
        router.push(`/modulos/marketing/calendario-conteudo/${postId}`);
        router.refresh();
      }
    });
  }

  function handleCancelClick() {
    if (post && onCancelEdit && isEditing) {
      if (isDirty) setDiscardOpen(true);
      else onCancelEdit();
      return;
    }
    if (isDirty) setDiscardOpen(true);
    else router.push(cancelHref);
  }

  function onFileChange(file: File | null) {
    markDirty();
    if (filePreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(filePreviewUrl);
    if (!file?.size) {
      setFilePreviewUrl(null);
      setFileMimeType(undefined);
      return;
    }
    setFilePreviewUrl(URL.createObjectURL(file));
    setFileMimeType(file.type);
  }

  const formFields = (
    <>
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
            disabled={fieldDisabled}
            onChange={markDirty}
          />
        </div>

        {isNewCompose ? (
          <div className="space-y-2 sm:col-span-2">
            <Label>Redes sociais</Label>
            <div className="flex flex-wrap gap-3">
              {platforms.map((p) => (
                <label
                  key={p.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                    selectedPlatformIds.includes(p.id)
                      ? "border-primary bg-primary/5"
                      : "border-input hover:bg-muted/50",
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={selectedPlatformIds.includes(p.id)}
                    disabled={fieldDisabled}
                    onChange={() => togglePlatform(p.id)}
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Será criado um post por rede selecionada (mesmo conteúdo). A mesma conta
              Meta vale para Instagram e Facebook.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Plataforma</Label>
            <Select
              value={platformId}
              disabled={fieldDisabled}
              onChange={(e) => setPlatformId(e.target.value)}
            >
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Tipo de conteúdo</Label>
          <Select
            value={contentType}
            disabled={fieldDisabled}
            onChange={(e) => {
              markDirty();
              setContentType(e.target.value as CreatableContentType);
            }}
          >
            {contentTypeOptions.map((t) => (
              <option key={t} value={t}>
                {CONTENT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_credential_id">Conta Meta (Instagram e Facebook)</Label>
          <Select
            id="meta_credential_id"
            name="credential_id"
            className="w-full"
            value={metaCredentialId}
            disabled={fieldDisabled}
            onChange={(e) => {
              markDirty();
              setMetaCredentialId(e.target.value);
            }}
          >
            <option value="">Selecione…</option>
            {metaCredentials.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Campanha (opcional)</Label>
          <CampaignPickerDialog
            campaigns={campaigns}
            value={campaignId}
            disabled={fieldDisabled}
            onChange={(id) => {
              markDirty();
              setCampaignId(id);
            }}
            onCampaignsChange={setCampaigns}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduled_at">Data e hora</Label>
          <Input
            id="scheduled_at"
            name="scheduled_at"
            type="datetime-local"
            required
            disabled={fieldDisabled}
            defaultValue={
              post?.scheduled_at
                ? new Date(post.scheduled_at).toISOString().slice(0, 16)
                : ""
            }
            onChange={markDirty}
          />
        </div>
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
          disabled={fieldDisabled}
          onChange={(e) => {
            markDirty();
            setCopy(e.target.value);
          }}
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
          disabled={fieldDisabled}
          onChange={(e) => {
            markDirty();
            setHashtagsRaw(e.target.value);
          }}
          placeholder="imbil, marketing, novidade"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Mídia</Label>
        {!readOnly && (
          <Input
            id="file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,video/mp4,video/quicktime"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
        )}
        {mediaPreviewUrl && (
          <div className="overflow-hidden rounded-md border">
            {mediaMimeType?.startsWith("video/") ||
            contentType === "video" ||
            contentType === "reels" ? (
              <video
                src={mediaPreviewUrl}
                className="max-h-48 w-full object-contain"
                controls
                muted
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaPreviewUrl}
                alt=""
                className="max-h-48 w-full object-contain"
              />
            )}
          </div>
        )}
        {post?.assets?.length ? (
          <ul className="text-xs text-muted-foreground">
            {post.assets.map((a) => (
              <li key={a.id}>
                {a.file_name} ({a.asset_type})
              </li>
            ))}
          </ul>
        ) : readOnly && !post?.assets?.length ? (
          <p className="text-xs text-muted-foreground">Nenhuma mídia anexada.</p>
        ) : null}
      </div>
    </>
  );

  const composeStyleActions = (
    <div className="flex flex-wrap items-center gap-2 border-t pt-4">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={handleCancelClick}
      >
        Cancelar
      </Button>
      <div className="flex-1" />
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        className="text-muted-foreground"
        onClick={(e) => {
          const form = (e.target as HTMLElement).closest("form");
          if (!form) return;
          handleSubmit(new FormData(form), false);
        }}
      >
        Salvar rascunho
      </Button>
      <Button
        type="button"
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
  );

  const showFormActions = !post || isEditing;

  const actionButtons = !showFormActions ? null : isNewCompose ? (
    composeStyleActions
  ) : showPreviewPanel && post ? (
    composeStyleActions
  ) : (
    <div className="flex flex-wrap gap-2">
      <Button
        type="submit"
        variant="secondary"
        disabled={pending}
        className="text-muted-foreground"
      >
        Salvar rascunho
      </Button>
      <Button
        type="button"
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
  );

  const discardDialog = (
    <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Descartar publicação?</DialogTitle>
          <DialogDescription>
            As alterações não salvas serão perdidas. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setDiscardOpen(false)}>
            Continuar editando
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (post && onCancelEdit) onCancelEdit();
              else router.push(cancelHref);
            }}
          >
            Descartar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (showPreviewPanel) {
    return (
      <>
        <form
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:items-start"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="min-w-0 space-y-6">{formFields}</div>

          <PostPreviewPanel
            platforms={previewPlatforms}
            caption={preview}
            mediaPreviewUrl={mediaPreviewUrl}
            mediaMimeType={mediaMimeType}
            contentType={contentType}
            accountLabel={accountLabel}
          />

          {actionButtons ? <div className="lg:col-span-2">{actionButtons}</div> : null}
        </form>
        {discardDialog}
      </>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(new FormData(e.currentTarget), false);
      }}
    >
      {formFields}
      {actionButtons}
    </form>
  );
}
