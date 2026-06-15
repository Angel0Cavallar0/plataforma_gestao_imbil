import { describe, expect, it } from "vitest";
import { buildAdsManagerUrl } from "@/lib/constants/marketing-ads";
import {
  aggregateGoogle,
  aggregateLinkedIn,
  aggregateMeta,
} from "@/lib/marketing/platform-metrics";
import { parseAdSpendFilters } from "@/lib/marketing/ad-spend";

describe("buildAdsManagerUrl", () => {
  it("monta deep link de conta/campanha/anúncio do Meta", () => {
    const c = { ad_account_id: "act_123" };
    expect(buildAdsManagerUrl("meta_ads", "account", c)).toContain("act=act_123");
    expect(buildAdsManagerUrl("meta_ads", "campaign", c, { campaignId: "9" })).toContain(
      "selected_campaign_ids=9",
    );
    expect(buildAdsManagerUrl("meta_ads", "ad", c, { adId: "7" })).toContain(
      "selected_ad_ids=7",
    );
  });

  it("monta deep link do Google com ocid", () => {
    const c = { customer_id: "555" };
    expect(buildAdsManagerUrl("google_ads", "campaign", c, { campaignId: "1" })).toBe(
      "https://ads.google.com/aw/ads?ocid=555&campaignId=1",
    );
  });

  it("monta deep link do LinkedIn por conta e campanha", () => {
    const c = { account_id: "777" };
    expect(buildAdsManagerUrl("linkedin_ads", "account", c)).toContain("/accounts/777");
    expect(
      buildAdsManagerUrl("linkedin_ads", "campaign", c, { campaignId: "42" }),
    ).toContain("/campaigns/42");
  });

  it("retorna null quando faltam os IDs da conta", () => {
    expect(buildAdsManagerUrl("meta_ads", "account", {})).toBeNull();
    expect(buildAdsManagerUrl("google_ads", "account", {})).toBeNull();
    expect(buildAdsManagerUrl("linkedin_ads", "account", {})).toBeNull();
  });
});

describe("aggregateMeta", () => {
  it("soma entrega e deriva frequência/ROAS; rankings só do dia mais recente", () => {
    const rows = [
      {
        ad_id: "a1",
        data_referencia: "2026-06-01",
        impressions: 1000,
        reach: 500,
        clicks: 10,
        spend: 50,
        leads: 2,
        conversion_value: 200,
        landing_page_views: 8,
        post_engagement: 30,
        quality_ranking: "average",
      },
      {
        ad_id: "a1",
        data_referencia: "2026-06-02",
        impressions: 1000,
        reach: 500,
        clicks: 10,
        spend: 50,
        leads: 3,
        conversion_value: 200,
        landing_page_views: 7,
        post_engagement: 20,
        quality_ranking: "above_average",
      },
    ];
    const s = aggregateMeta(rows);
    expect(s.impressions).toBe(2000);
    expect(s.reach).toBe(1000);
    expect(s.frequency).toBe(2);
    expect(s.leads).toBe(5);
    expect(s.roas).toBe(4); // 400 / 100
    expect(s.landing_page_views).toBe(15);
    // estado mais recente (06-02) => above_average
    expect(s.rankings.quality).toEqual({ above_average: 1 });
  });

  it("usa pixel_lead como fallback de leads", () => {
    const s = aggregateMeta([
      { ad_id: "a", data_referencia: "2026-06-01", pixel_lead: 4 },
    ]);
    expect(s.leads).toBe(4);
  });
});

describe("aggregateGoogle", () => {
  it("pondera o impression share pelas impressões", () => {
    const s = aggregateGoogle([
      { impressions: 100, search_impression_share: 0.5, cost: 10, clicks: 5 },
      { impressions: 300, search_impression_share: 0.9, cost: 30, clicks: 15 },
    ]);
    // (0.5*100 + 0.9*300) / 400 = 0.8 => 80%
    expect(s.search_impression_share).toBe(80);
    expect(s.spend).toBe(40);
  });
});

describe("aggregateLinkedIn", () => {
  it("calcula taxa de conclusão do formulário", () => {
    const s = aggregateLinkedIn([
      { lead_gen_form_opens: 10, lead_gen_submissions: 4, spend: 20 },
    ]);
    expect(s.form_completion_rate).toBe(40);
  });
});

describe("parseAdSpendFilters", () => {
  it("aplica período padrão e ignora plataformas inválidas", () => {
    const f = parseAdSpendFilters({ platforms: "meta_ads,foo" });
    expect(f.date_from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(f.platforms).toEqual(["meta_ads"]);
  });

  it("normaliza date_to anterior a date_from", () => {
    const f = parseAdSpendFilters({
      date_from: "2026-06-10",
      date_to: "2026-06-01",
    });
    expect(f.date_to).toBe("2026-06-10");
  });
});
