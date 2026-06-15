import type { AdManagerLevel, AdPlatformSlug } from "@/types/marketing-ads";

/** Plataformas de mídia paga na ordem de exibição das tabs. */
export const AD_PLATFORM_SLUGS: readonly AdPlatformSlug[] = [
  "meta_ads",
  "google_ads",
  "linkedin_ads",
] as const;

type AdPlatformMeta = {
  slug: AdPlatformSlug;
  /** slug usado na URL da rota (/midia-paga/{routeSlug}). */
  routeSlug: "meta" | "google" | "linkedin";
  name: string;
  /** Cor da marca (usada nos gráficos/legendas). */
  color: string;
  /** Rótulo do "resultado/conversão" daquela plataforma (Seção 6.2). */
  conversionLabel: string;
  /** true quando a plataforma fornece valor monetário de conversão → ROAS real. */
  hasConversionValue: boolean;
};

export const AD_PLATFORMS: Record<AdPlatformSlug, AdPlatformMeta> = {
  meta_ads: {
    slug: "meta_ads",
    routeSlug: "meta",
    name: "Meta Ads",
    color: "#1877F2",
    conversionLabel: "Leads (fallback: Pixel Lead)",
    hasConversionValue: true,
  },
  google_ads: {
    slug: "google_ads",
    routeSlug: "google",
    name: "Google Ads",
    color: "#22C55E",
    conversionLabel: "Conversões",
    hasConversionValue: true,
  },
  linkedin_ads: {
    slug: "linkedin_ads",
    routeSlug: "linkedin",
    name: "LinkedIn Ads",
    color: "#38BDF8",
    conversionLabel: "Envios de Lead Gen Form",
    hasConversionValue: false,
  },
};

export const AD_PLATFORM_BY_ROUTE: Record<string, AdPlatformSlug> = {
  meta: "meta_ads",
  google: "google_ads",
  linkedin: "linkedin_ads",
};

/** Mensagem do tooltip quando ROAS é indisponível (LinkedIn). */
export const ROAS_UNAVAILABLE_TOOLTIP =
  "LinkedIn não fornece valor de conversão; ROAS indisponível";

/** Explicação da definição heterogênea de "conversão" entre canais (ícone info). */
export const CONVERSION_DEFINITION_TOOLTIP =
  "A base de 'conversão' difere por canal: Meta usa Leads (fallback Pixel Lead), " +
  "Google usa Conversões e LinkedIn usa Envios de Lead Gen Form.";

/**
 * Monta a URL do gerenciador de anúncios externo (Seção 8.1).
 * Função pura — recebe as credenciais já resolvidas. Retorna null
 * quando faltam os IDs necessários para o nível solicitado.
 */
export function buildAdsManagerUrl(
  platformSlug: AdPlatformSlug,
  level: AdManagerLevel,
  creds: Record<string, string>,
  ids?: { campaignId?: string; adId?: string },
): string | null {
  switch (platformSlug) {
    case "meta_ads": {
      const act = creds.ad_account_id;
      if (!act) return null;
      const base = "https://business.facebook.com/adsmanager/manage";
      if (level === "ad" && ids?.adId) {
        return `${base}/ads?act=${act}&selected_ad_ids=${ids.adId}`;
      }
      if (level === "campaign" && ids?.campaignId) {
        return `${base}/ads?act=${act}&selected_campaign_ids=${ids.campaignId}`;
      }
      return `${base}/campaigns?act=${act}`;
    }
    case "google_ads": {
      const ocid = creds.customer_id;
      if (!ocid) return null;
      if (level === "campaign" && ids?.campaignId) {
        return `https://ads.google.com/aw/ads?ocid=${ocid}&campaignId=${ids.campaignId}`;
      }
      // Google não tem deep link estável por anúncio individual: cai p/ campanha.
      if (level === "ad" && ids?.campaignId) {
        return `https://ads.google.com/aw/ads?ocid=${ocid}&campaignId=${ids.campaignId}`;
      }
      return `https://ads.google.com/aw/campaigns?ocid=${ocid}`;
    }
    case "linkedin_ads": {
      const account = creds.account_id;
      if (!account) return null;
      const base = `https://www.linkedin.com/campaignmanager/accounts/${account}`;
      if ((level === "campaign" || level === "ad") && ids?.campaignId) {
        return `${base}/campaigns/${ids.campaignId}`;
      }
      return base;
    }
    default:
      return null;
  }
}
