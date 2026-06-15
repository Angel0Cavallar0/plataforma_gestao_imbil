import type { ContentType, PostStatus } from "@/types/marketing";

export const COPY_MAX_LENGTH = 2200;

export type MarketingSubmodule = {
  slug: string;
  name: string;
  href: string;
  /** Itens aninhados exibidos como subgrupo no menu lateral. */
  children?: readonly { slug: string; name: string; href: string }[];
};

export const MARKETING_SUBMODULES: readonly MarketingSubmodule[] = [
  {
    slug: "calendario-conteudo",
    name: "Calendário de Conteúdo",
    href: "/modulos/marketing/calendario-conteudo",
  },
  {
    slug: "eventos",
    name: "Gestão de Eventos",
    href: "/modulos/marketing/eventos",
    children: [
      {
        slug: "eventos",
        name: "Eventos",
        href: "/modulos/marketing/eventos",
      },
      {
        slug: "eventos-formularios",
        name: "Formulários",
        href: "/modulos/marketing/eventos/formularios",
      },
      {
        slug: "eventos-leads",
        name: "Leads",
        href: "/modulos/marketing/eventos/leads",
      },
      {
        slug: "eventos-roi",
        name: "ROI Evento",
        href: "/modulos/marketing/eventos/roi",
      },
    ],
  },
  {
    slug: "midia-paga",
    name: "Mídia Paga",
    href: "/modulos/marketing/midia-paga",
    children: [
      {
        slug: "midia-paga-geral",
        name: "Visão geral",
        href: "/modulos/marketing/midia-paga",
      },
      {
        slug: "midia-paga-meta",
        name: "Meta Ads",
        href: "/modulos/marketing/midia-paga/meta",
      },
      {
        slug: "midia-paga-google",
        name: "Google Ads",
        href: "/modulos/marketing/midia-paga/google",
      },
      {
        slug: "midia-paga-linkedin",
        name: "LinkedIn Ads",
        href: "/modulos/marketing/midia-paga/linkedin",
      },
    ],
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

export const CONTENT_TYPES_REQUIRING_MEDIA: ContentType[] = [
  "imagem",
  "video",
  "carrossel",
  "reels",
  "story",
];

/** Status a partir dos quais um post pode ser publicado (claim atômico). */
export const PUBLISHABLE_FROM_STATUSES: PostStatus[] = ["agendado", "falhou"];

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
