import { Badge } from "@/components/ui/badge";
import { POST_STATUS_LABELS } from "@/lib/constants/marketing";
import type { PostStatus } from "@/types/marketing";

const variantMap: Record<
  PostStatus,
  "muted" | "warning" | "success" | "destructive" | "secondary"
> = {
  rascunho: "muted",
  agendado: "warning",
  publicando: "secondary",
  publicado: "success",
  falhou: "destructive",
  cancelado: "muted",
};

export function PostStatusBadge({ status }: { status: PostStatus }) {
  return <Badge variant={variantMap[status]}>{POST_STATUS_LABELS[status]}</Badge>;
}
