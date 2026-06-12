"use client";

import { useRef } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CONTENT_TYPE_LABELS } from "@/lib/constants/marketing";
import type { ContentType } from "@/types/marketing";
import { cn } from "@/lib/utils";

export type SingleMediaSaved = {
  id: string;
  fileName: string;
  previewUrl: string | null;
  mimeType: string;
};

type Props = {
  contentType: ContentType;
  pendingFileName?: string | null;
  previewUrl: string | null;
  mimeType?: string;
  savedAsset?: SingleMediaSaved | null;
  readOnly?: boolean;
  disabled?: boolean;
  onFileSelect: (file: File) => void;
  onClearPending: () => void;
  onDeleteSaved?: (assetId: string) => void;
};

function acceptForType(contentType: ContentType): string {
  if (contentType === "video" || contentType === "reels") {
    return "video/mp4,video/quicktime";
  }
  if (contentType === "story") {
    return "image/jpeg,image/png,video/mp4,video/quicktime";
  }
  return "image/jpeg,image/png";
}

function emptyHintForType(contentType: ContentType): string {
  if (contentType === "video") return "Adicione um vídeo (MP4 ou MOV).";
  if (contentType === "reels") return "Adicione um vídeo para Reels (MP4 ou MOV).";
  if (contentType === "story") return "Adicione uma imagem ou vídeo para Story.";
  return "Adicione uma imagem (JPG ou PNG).";
}

function buttonLabelForType(contentType: ContentType): string {
  if (contentType === "video" || contentType === "reels") return "Adicionar vídeo";
  if (contentType === "story") return "Adicionar mídia";
  return "Adicionar imagem";
}

function isVideoPreview(mimeType: string | undefined, contentType: ContentType): boolean {
  return (
    mimeType?.startsWith("video/") || contentType === "video" || contentType === "reels"
  );
}

export function PostSingleMediaEditor({
  contentType,
  pendingFileName,
  previewUrl,
  mimeType,
  savedAsset,
  readOnly,
  disabled,
  onFileSelect,
  onClearPending,
  onDeleteSaved,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasPreview = !!previewUrl;
  const displayName = pendingFileName ?? savedAsset?.fileName;
  const showVideo = isVideoPreview(mimeType, contentType);

  function handleFilesSelected(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file?.size) return;
    onFileSelect(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove() {
    if (pendingFileName) {
      onClearPending();
      return;
    }
    if (savedAsset?.id && onDeleteSaved) {
      void onDeleteSaved(savedAsset.id);
    }
  }

  return (
    <div className="space-y-3">
      <Label>Mídia · {CONTENT_TYPE_LABELS[contentType]}</Label>

      {!hasPreview ? (
        <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          {emptyHintForType(contentType)}
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border bg-card">
          {showVideo ? (
            <video
              src={previewUrl!}
              className="max-h-48 w-full object-contain"
              controls
              muted
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl!} alt="" className="max-h-48 w-full object-contain" />
          )}
          {displayName && (
            <p className="truncate border-t px-3 py-2 text-xs text-muted-foreground">
              {displayName}
            </p>
          )}
        </div>
      )}

      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={acceptForType(contentType)}
            className="sr-only"
            disabled={disabled}
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            {hasPreview ? "Substituir mídia" : buttonLabelForType(contentType)}
          </Button>
          {hasPreview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className={cn("text-destructive hover:text-destructive")}
              onClick={handleRemove}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Remover
            </Button>
          )}
        </div>
      )}

      {readOnly && !hasPreview && (
        <p className="text-xs text-muted-foreground">Nenhuma mídia anexada.</p>
      )}
    </div>
  );
}
