import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { brl } from "@/lib/marketing/dashboard";
import type { InvestmentReturnRow } from "@/types/marketing-dashboard";

/** Tabela canal × investimento × resultado × custo por resultado. */
export function InvestmentVsReturnTable({ rows }: { rows: InvestmentReturnRow[] }) {
  const totalInvestment = rows.reduce((s, r) => s + r.investment, 0);
  const totalResult = rows.reduce((s, r) => s + r.result, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Investimento × retorno por canal</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sem investimento no período.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Canal</th>
                  <th className="py-2 pr-4 text-right font-medium">Investimento</th>
                  <th className="py-2 pr-4 text-right font-medium">Retorno estimado</th>
                  <th className="py-2 text-right font-medium">Custo / resultado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.channel} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{r.channel}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {brl(r.investment)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {r.result > 0 ? brl(r.result) : "—"}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {r.cost_per_result != null ? brl(r.cost_per_result) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-medium">
                  <td className="py-2 pr-4">Total</td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {brl(totalInvestment)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {totalResult > 0 ? brl(totalResult) : "—"}
                  </td>
                  <td className="py-2 text-right">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
