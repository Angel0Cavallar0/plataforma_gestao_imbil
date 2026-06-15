/**
 * Estilo compartilhado dos tooltips do Recharts para os gráficos da Mídia Paga.
 * Usa os tokens do tema (claro/escuro) em vez do fundo branco padrão, que
 * deixava a leitura difícil no tema escuro.
 */
export const chartTooltipProps = {
  contentStyle: {
    backgroundColor: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "0.5rem",
    color: "var(--popover-foreground)",
    fontSize: "12px",
    boxShadow: "0 4px 12px rgb(0 0 0 / 0.15)",
  } as const,
  labelStyle: { color: "var(--popover-foreground)", fontWeight: 600 } as const,
  itemStyle: { color: "var(--popover-foreground)" } as const,
} as const;

/** Cursor de hover (barras) usando o token muted para não “estourar” em branco. */
export const chartCursorFill = { fill: "var(--muted)", opacity: 0.4 } as const;
