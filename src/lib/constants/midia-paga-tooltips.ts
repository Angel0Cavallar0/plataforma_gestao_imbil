/**
 * Textos dos tooltips (ícone "?") exibidos ao lado de cada métrica/card nas
 * páginas do submódulo de Mídia Paga. Conteúdo fornecido pelo time de marketing
 * da IMBIL (documento "Tooltips — Métricas de Mídia Paga").
 */

export const OVERVIEW_TOOLTIPS = {
  spend_total:
    "Soma de todos os valores investidos nas plataformas ativas (Meta Ads, Google Ads e LinkedIn Ads) no período selecionado.",
  cost_per_conversion:
    'Valor médio gasto para cada resultado obtido (lead, clique ou conversão), considerando todas as plataformas. Quando não há resultados registrados, o indicador é exibido como "—".',
  conversion_rate:
    "Percentual de cliques que resultaram em uma conversão (lead, cadastro, compra etc.), considerando todas as plataformas. Depende da correta configuração de eventos de conversão em cada plataforma.",
  roas: "Retorno sobre o investimento em anúncios consolidado entre Meta Ads e Google Ads. O LinkedIn Ads é exibido separadamente por não ter conversão mensurável configurada. Calculado como receita gerada ÷ valor investido.",
  investment_share:
    "Distribuição percentual do investimento total entre as plataformas ativas. Permite visualizar onde o orçamento está concentrado e comparar a alocação entre Meta Ads, Google Ads e LinkedIn Ads.",
  conversion_funnel:
    "Visualização comparativa entre plataformas das principais etapas do funil: Impressões → Cliques → Landing Page Views → Conversões. Permite identificar em qual etapa cada plataforma performa melhor ou tem maior queda.",
  trend:
    "Evolução diária do Custo por Clique (CPC) de cada plataforma ao longo do período. Permite identificar variações de eficiência e picos de custo ao longo do tempo. Também pode ser alternado para exibir CPM (custo por mil impressões) ou CTR (taxa de clique).",
} as const;

export const META_TOOLTIPS = {
  investment: "Valor total gasto no período selecionado.",
  impressions:
    "Total de vezes que seus anúncios foram exibidos para usuários na plataforma.",
  reach:
    "Número de pessoas únicas que viram seus anúncios. A frequência indica quantas vezes, em média, cada pessoa foi impactada.",
  landing_page_views:
    "Número de vezes que alguém clicou no anúncio e carregou completamente a página de destino (diferente de cliques, que não garantem o carregamento total da página).",
  clicks:
    "Total de cliques registrados nos anúncios. O CTR (Click-Through Rate) indica o percentual de impressões que resultaram em clique.",
  conversions:
    "Número de leads gerados a partir dos anúncios, conforme a configuração de evento de conversão no Gerenciador de Anúncios.",
  engagement:
    "Soma de reações, comentários, compartilhamentos, cliques e outras interações dos usuários com o anúncio.",
  roas: "Retorno sobre o investimento em anúncios (Return on Ad Spend). Calculado como receita gerada ÷ valor investido. Quanto maior, melhor o desempenho financeiro da campanha.",
  thruplays:
    "Número de reproduções de vídeo assistidas até o final ou por pelo menos 15 segundos (indica um engajamento mais qualificado com o conteúdo).",
  video_p25:
    "Quantidade de reproduções em que o vídeo foi assistido até 25% do tempo total.",
  video_p50: "Quantidade de reproduções em que o vídeo foi assistido até a metade.",
  video_p75:
    "Quantidade de reproduções em que o vídeo foi assistido até 75% do tempo total.",
  video_p100: "Quantidade de reproduções completas do vídeo.",
  ranking_quality:
    "Avaliação da qualidade percebida do anúncio em comparação com outros anúncios concorrendo pelo mesmo público. Baseado em sinais de experiência do usuário, como feedbacks negativos e tempo na página.",
  ranking_engagement:
    "Avaliação da taxa de engajamento esperada do anúncio em relação aos concorrentes. Considera curtidas, cliques e compartilhamentos históricos de anúncios similares.",
  ranking_conversion:
    "Avaliação da probabilidade de conversão do anúncio em comparação com concorrentes que disputam o mesmo objetivo e público.",
} as const;

export const GOOGLE_TOOLTIPS = {
  investment: "Valor total gasto no período selecionado.",
  impressions:
    "Total de vezes que seus anúncios foram exibidos nos resultados de busca do Google ou na rede de display.",
  clicks:
    "Total de cliques registrados nos anúncios. O CTR (Click-Through Rate) indica o percentual de impressões que resultaram em clique.",
  conversions:
    "Ações valiosas realizadas pelo usuário após clicar no anúncio (ex: compra, cadastro, ligação), conforme a configuração de conversão da conta.",
  impression_share:
    "Percentual de impressões que seus anúncios efetivamente receberam em relação ao total de impressões para as quais eram elegíveis. Um Impression Share baixo indica oportunidade de crescimento.",
  lost_budget:
    "Percentual de impressões elegíveis que você deixou de receber porque seu orçamento diário foi esgotado antes do fim do dia. Aumentar o orçamento pode recuperar essas impressões.",
  lost_rank:
    "Percentual de impressões elegíveis que você perdeu porque o Quality Score ou o lance máximo não foram suficientes para vencer o leilão. Melhorar a relevância do anúncio e da landing page, ou aumentar o lance, pode reduzir esse índice.",
  roas: "Retorno sobre o investimento em anúncios (Return on Ad Spend). Calculado como receita gerada ÷ valor investido. Requer configuração de conversão com valor para ser calculado.",
} as const;

export const LINKEDIN_TOOLTIPS = {
  investment: "Valor total gasto no período selecionado.",
  impressions:
    "Total de vezes que seus anúncios foram exibidos no feed ou em outros posicionamentos dentro do LinkedIn.",
  reach:
    "Número de membros únicos do LinkedIn que viram seus anúncios ao menos uma vez no período.",
  clicks:
    "Total de cliques registrados nos anúncios. O CTR (Click-Through Rate) indica o percentual de impressões que resultaram em clique. No LinkedIn, o CTR tende a ser naturalmente menor devido ao perfil mais profissional e seletivo do público.",
  lead_gen_submissions:
    "Número de formulários de geração de leads (Lead Gen Forms) enviados pelos usuários — cada envio representa um lead capturado diretamente na plataforma, sem sair do LinkedIn.",
  completion_rate:
    "Percentual de usuários que abriram o formulário Lead Gen e concluíram o envio. Uma taxa baixa pode indicar que o formulário tem muitos campos ou que a oferta não é atraente o suficiente.",
  social_engagement:
    "Soma de curtidas, comentários, compartilhamentos e novos seguidores gerados pelos anúncios no período. Indica o impacto orgânico e de marca das campanhas além dos cliques diretos.",
  roas: "Retorno sobre o investimento em anúncios (Return on Ad Spend). Calculado como receita gerada ÷ valor investido. Requer configuração de conversão com valor para ser calculado.",
} as const;
