import { CompetitorsTabs } from "@/components/marketing/competitors/CompetitorsTabs";
import { ParamSelect } from "@/components/marketing/competitors/shared/ParamSelect";
import { KeywordRankingMatrix } from "@/components/marketing/competitors/search/KeywordRankingMatrix";
import { KeywordPositionTrend } from "@/components/marketing/competitors/search/KeywordPositionTrend";
import { TrendsLineChart } from "@/components/marketing/competitors/search/TrendsLineChart";
import { ShareOfInterestCard } from "@/components/marketing/competitors/search/ShareOfInterestCard";
import { firstParam } from "@/lib/marketing/competitors";
import {
  getKeywordHistory,
  getKeywordList,
  getKeywordMatrix,
  getTrendGeos,
  getTrendKeywords,
  getTrends,
} from "@/server/queries/marketing/competitors";

export default async function ConcorrentesBuscaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const trendKeyword = firstParam(sp.tkw);
  const geo = firstParam(sp.geo);

  const [matrix, keywordList, trendKeywords, geos, trends] = await Promise.all([
    getKeywordMatrix(),
    getKeywordList(),
    getTrendKeywords(),
    getTrendGeos(),
    getTrends({ keyword: trendKeyword, geo }),
  ]);

  const selectedKw = firstParam(sp.kw) ?? keywordList[0];
  const rankings = selectedKw ? await getKeywordHistory(selectedKw) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Concorrentes — Busca & Tendências</h1>
        <p className="text-sm text-muted-foreground">
          Ranking orgânico no Google e interesse de mercado — com a Imbil como benchmark.
        </p>
      </div>

      <CompetitorsTabs />

      {/* Ranking de palavras-chave */}
      <KeywordRankingMatrix matrix={matrix} />

      {keywordList.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">Evolução de posição:</span>
            <ParamSelect
              paramKey="kw"
              ariaLabel="Palavra-chave"
              allLabel={selectedKw ?? "Selecione"}
              options={keywordList.map((k) => ({ value: k, label: k }))}
              className="w-64"
            />
          </div>
          {selectedKw && (
            <KeywordPositionTrend keyword={selectedKw} rankings={rankings} />
          )}
        </div>
      )}

      {/* Tendências de interesse */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">Interesse de mercado (Google Trends)</h2>
          <ParamSelect
            paramKey="tkw"
            ariaLabel="Filtrar por palavra-chave"
            allLabel="Todas as palavras-chave"
            options={trendKeywords.map((k) => ({ value: k, label: k }))}
            className="w-56"
          />
          <ParamSelect
            paramKey="geo"
            ariaLabel="Filtrar por região"
            allLabel="Todas as regiões"
            options={geos.map((g) => ({ value: g, label: g }))}
            className="w-40"
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <TrendsLineChart series={trends} />
          <ShareOfInterestCard series={trends} />
        </div>
      </div>
    </div>
  );
}
