"use client";

import { useRef } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CAROUSEL_MAX_ITEMS, CAROUSEL_MIN_ITEMS } from "@/lib/constants/marketing";
import { cn } from "@/lib/utils";

export type CarouselPendingItem = {
  id: string;
  file: File;
  previewUrl: string;
  mimeType: string;
};

export type CarouselSavedItem = {
  id: string;
  fileName: string;
  previewUrl: string | null;
  mimeType: string;
};

export type CarouselEditorItem =
  | { kind: "pending"; data: CarouselPendingItem }
  | { kind: "saved"; data: CarouselSavedItem };

type Props = {
  items: CarouselEditorItem[];
  readOnly?: boolean;
  disabled?: boolean;
  onItemsChange: (items: CarouselEditorItem[]) => void;
  onAddFiles: (files: File[]) => void;
  onDeleteSaved: (assetId: string) => void | Promise<void>;
};

function moveItem(items: CarouselEditorItem[], index: number, delta: number) {
  const next = [...items];
  const target = index + delta;
  if (target < 0 || target >= next.length) return items;
  const tmp = next[index]!;
  next[index] = next[target]!;
  next[target] = tmp;
  return next;
}

export function PostCarouselAssetsEditor({
  items,
  readOnly,
  disabled,
  onItemsChange,
  onAddFiles,
  onDeleteSaved,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const atMax = items.length >= CAROUSEL_MAX_ITEMS;

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList?.length) return;
    const images = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    const remaining = CAROUSEL_MAX_ITEMS - items.length;
    if (remaining <= 0) return;
    onAddFiles(images.slice(0, remaining));
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeItem(index: number) {
    const item = items[index];
    if (!item) return;
    if (item.kind === "pending" && item.data.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(item.data.previewUrl);
    }
    if (item.kind === "saved") {
      void onDeleteSaved(item.data.id);
    }
    onItemsChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Imagens do carrossel</Label>
        <span className="text-xs text-muted-foreground">
          {items.length}/{CAROUSEL_MAX_ITEMS} · mín. {CAROUSEL_MIN_ITEMS}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          Adicione entre {CAROUSEL_MIN_ITEMS} e {CAROUSEL_MAX_ITEMS} imagens (JPG ou PNG).
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((item, index) => {
            const url =
              item.kind === "pending" ? item.data.previewUrl : item.data.previewUrl;
            const name =
              item.kind === "pending" ? item.data.file.name : item.data.fileName;
            return (
              <li
                key={item.kind === "pending" ? `p-${item.data.id}` : `s-${item.data.id}`}
                className="flex gap-2 rounded-md border bg-card p-2"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-muted">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                      Sem prévia
                    </div>
                  )}
                  <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] font-medium text-white">
                    {index + 1}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
                  <p className="truncate text-xs" title={name}>
                    {name}
                  </p>
                  {!readOnly && (
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={disabled || index === 0}
                        aria-label="Mover para cima"
                        onClick={() => onItemsChange(moveItem(items, index, -1))}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={disabled || index === items.length - 1}
                        aria-label="Mover para baixo"
                        onClick={() => onItemsChange(moveItem(items, index, 1))}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className={cn(
                          "h-7 w-7",
                          "text-destructive hover:text-destructive",
                        )}
                        disabled={disabled}
                        aria-label="Remover"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!readOnly && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="sr-only"
            disabled={disabled || atMax}
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || atMax}
            onClick={() => inputRef.current?.click()}
          >
            Adicionar imagens
          </Button>
        </>
      )}
    </div>
  );
}
