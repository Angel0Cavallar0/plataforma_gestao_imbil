import { COPY_MAX_LENGTH } from "@/lib/constants/marketing";

/** Monta legenda final enviada à Meta (copy + hashtags). */
export function formatCaption(
  copy: string | null | undefined,
  hashtags: string[] | null | undefined,
): string {
  const base = (copy ?? "").trim();
  const tags = (hashtags ?? [])
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean)
    .map((t) => `#${t}`);

  if (!tags.length) return base;
  if (!base) return tags.join(" ");
  return `${base}\n\n${tags.join(" ")}`;
}

export function captionLength(
  copy: string | null | undefined,
  hashtags: string[] | null | undefined,
): number {
  return formatCaption(copy, hashtags).length;
}

export function isCaptionWithinLimit(
  copy: string | null | undefined,
  hashtags: string[] | null | undefined,
): boolean {
  return captionLength(copy, hashtags) <= COPY_MAX_LENGTH;
}
