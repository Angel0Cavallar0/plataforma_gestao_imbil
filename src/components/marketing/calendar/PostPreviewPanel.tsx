import { PostSocialPreview } from "@/components/marketing/calendar/PostSocialPreview";
import type {
  PreviewMediaItem,
  PreviewPlatform,
} from "@/components/marketing/calendar/PostSocialPreview";
import type { ContentType } from "@/types/marketing";

type Props = {
  platforms: PreviewPlatform[];
  caption: string;
  mediaPreviewUrl: string | null;
  mediaMimeType?: string;
  mediaItems?: PreviewMediaItem[];
  contentType: ContentType;
  accountLabel?: string;
};

export function PostPreviewPanel({
  platforms,
  caption,
  mediaPreviewUrl,
  mediaMimeType,
  mediaItems,
  contentType,
  accountLabel,
}: Props) {
  return (
    <aside className="lg:sticky lg:top-4">
      <div className="rounded-xl border bg-card p-4 shadow-lg">
        <h2 className="mb-1 text-sm font-semibold">Prévia da publicação</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Visualização aproximada do feed
          {platforms.length > 1 ? " — deslize entre as redes" : ""}
        </p>
        <PostSocialPreview
          platforms={platforms}
          caption={caption}
          mediaPreviewUrl={mediaPreviewUrl}
          mediaMimeType={mediaMimeType}
          mediaItems={mediaItems}
          contentType={contentType}
          accountLabel={accountLabel}
        />
      </div>
    </aside>
  );
}
