import type { ContentType, PostStatus } from "@/types/marketing";

export const COPY_MAX_LENGTH = 2200;

export const MARKETING_SUBMODULES = [
  {
    slug: "calendario-conteudo",
    name: "Calendário de Conteúdo",
    href: "/modulos/marketing/calendario-conteudo",
  },
] as const;

export const POST_STATUSES: PostStatus[] = [
  "rascunho",
  "agendado",
  "publicando",
  "publicado",
  "falhou",
  "cancelado",
];

/** Tipos disponíveis ao criar/editar posts (texto e link descontinuados na UI). */
export const CONTENT_TYPES: ContentType[] = [
  "imagem",
  "video",
  "carrossel",
  "reels",
  "story",
];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  imagem: "Imagem",
  video: "Vídeo",
  carrossel: "Carrossel",
  reels: "Reels",
  story: "Story",
  texto: "Texto",
  link: "Link",
};

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  rascunho: "Rascunho",
  agendado: "Agendado",
  publicando: "Publicando",
  publicado: "Publicado",
  falhou: "Falhou",
  cancelado: "Cancelado",
};

/** Valid status transitions */
export const POST_STATUS_TRANSITIONS: Record<PostStatus, PostStatus[]> = {
  rascunho: ["agendado", "cancelado"],
  agendado: ["publicando", "cancelado", "rascunho"],
  publicando: ["publicado", "falhou"],
  publicado: [],
  falhou: ["agendado", "cancelado"],
  cancelado: ["rascunho"],
};

export const CONTENT_TYPES_REQUIRING_COPY: ContentType[] = [
  "imagem",
  "video",
  "carrossel",
  "reels",
  "story",
];

export const MARKETING_STORAGE_BUCKET = "marketing-content-assets";

/** Instagram / Facebook carrossel: mínimo e máximo de slides (Graph API). */
export const CAROUSEL_MIN_ITEMS = 2;
export const CAROUSEL_MAX_ITEMS = 10;

export const META_GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION ?? "v21.0";

export const ASSET_LIMITS: Record<
  string,
  Partial<Record<ContentType, { maxBytes: number; maxDurationSec?: number }>>
> = {
  instagram: {
    imagem: { maxBytes: 8 * 1024 * 1024 },
    video: { maxBytes: 100 * 1024 * 1024, maxDurationSec: 60 },
    reels: { maxBytes: 1024 * 1024 * 1024, maxDurationSec: 90 },
    story: { maxBytes: 100 * 1024 * 1024, maxDurationSec: 60 },
    carrossel: { maxBytes: 8 * 1024 * 1024 },
  },
  facebook: {
    imagem: { maxBytes: 4 * 1024 * 1024 },
    video: { maxBytes: 1024 * 1024 * 1024 },
    reels: { maxBytes: 1024 * 1024 * 1024, maxDurationSec: 90 },
    carrossel: { maxBytes: 4 * 1024 * 1024 },
  },
};
