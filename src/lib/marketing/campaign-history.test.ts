import { describe, expect, it } from "vitest";
import { buildCampaignHistory } from "@/lib/marketing/campaign-history";

const metaRows = [
  {
    campaign_id: "c1",
    campaign_name: null,
    ad_id: "a1",
    ad_name: "Anúncio 1",
    adset_name: "Conjunto A",
    data_referencia: "2026-06-02",
    impressions: 1000,
    clicks: 10,
    spend: 20,
    reach: 800,
    leads: 1,
  },
  {
    campaign_id: "c1",
    campaign_name: "Campanha X",
    ad_id: "a1",
    ad_name: "Anúncio 1",
    adset_name: "Conjunto A",
    data_referencia: "2026-06-01",
    impressions: 1000,
    clicks: 30,
    spend: 30,
    reach: 700,
    leads: 2,
  },
  {
    campaign_id: "c1",
    campaign_name: "Campanha X",
    ad_id: "a2",
    ad_name: "Anúncio 2",
    adset_name: "Conjunto A",
    data_referencia: "2026-06-01",
    impressions: 500,
    clicks: 5,
    spend: 100,
    reach: 400,
    leads: 0,
  },
];

describe("buildCampaignHistory", () => {
  it("agrupa por anúncio e ordena grupos por investimento desc", () => {
    const h = buildCampaignHistory("meta_ads", metaRows);
    expect(h.groupLabel).toBe("Anúncio");
    expect(h.groups).toHaveLength(2);
    // a2 gastou 100 > a1 (50) → vem primeiro
    expect(h.groups[0].id).toBe("a2");
    expect(h.groups[1].id).toBe("a1");
  });

  it("ordena as linhas diárias da mais recente para a mais antiga", () => {
    const h = buildCampaignHistory("meta_ads", metaRows);
    const a1 = h.groups.find((g) => g.id === "a1")!;
    expect(a1.rows.map((r) => r.data_referencia)).toEqual(["2026-06-02", "2026-06-01"]);
  });

  it("usa o primeiro campaign_name não nulo", () => {
    const h = buildCampaignHistory("meta_ads", metaRows);
    expect(h.campaignName).toBe("Campanha X");
  });

  it("calcula totais recompondo CTR/CPC e somando investimento", () => {
    const h = buildCampaignHistory("meta_ads", metaRows);
    const a1 = h.groups.find((g) => g.id === "a1")!;
    const col = (label: string) => h.columns.find((c) => c.label === label)!;
    // a1: impressões 2000, cliques 40, spend 50
    expect(col("Investimento").total(a1.rows)).toContain("50,00");
    expect(col("CTR").total(a1.rows)).toBe("2%"); // 40/2000*100
    expect(col("CPC").total(a1.rows)).toContain("1,25"); // 50/40
  });
});
