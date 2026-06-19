import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  /** Variação percentual vs período anterior (null = não exibe). */
  deltaPct?: number | null;
  /** Texto auxiliar abaixo do valor. */
  sub?: string;
  icon?: React.ReactNode;
  /** Quando true, queda é boa (ex.: CPC, posição em busca) → inverte cores. */
  invertDelta?: boolean;
};

/** Card de KPI com valor, label, e delta ▲▼ vs período anterior. */
export function KpiCard({ label, value, deltaPct, sub, icon, invertDelta }: Props) {
  const hasDelta =
    deltaPct !== undefined && deltaPct !== null && Number.isFinite(deltaPct);
  const up = hasDelta && deltaPct! > 0.05;
  const down = hasDelta && deltaPct! < -0.05;
  // Cor: subir costuma ser bom (verde); invertDelta troca a leitura.
  const good = invertDelta ? down : up;
  const bad = invertDelta ? up : down;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <div className="flex items-center gap-2 text-xs">
          {hasDelta ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium tabular-nums",
                good && "text-green-600 dark:text-green-400",
                bad && "text-destructive",
                !up && !down && "text-muted-foreground",
              )}
            >
              {up ? (
                <ArrowUp className="h-3 w-3" />
              ) : down ? (
                <ArrowDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {Math.abs(deltaPct!).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
            </span>
          ) : null}
          {sub ? <span className="text-muted-foreground">{sub}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}
