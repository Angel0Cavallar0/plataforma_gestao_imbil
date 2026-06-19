import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";
import { hasMarketingPermission } from "@/lib/auth/marketing";

export default async function DashboardsPage() {
  const session = await requireAuth();
  const canSeeMarketing = await hasMarketingPermission(session.user.id, "read");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Dashboards</h1>
        <p className="text-sm text-muted-foreground">
          Visões executivas consolidadas por módulo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {canSeeMarketing && (
          <Link href="/dashboards/marketing" className="group">
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Marketing
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                KPIs de conteúdo, mídia paga, investimento, eventos, insights,
                concorrentes e alertas — em uma só tela.
              </CardContent>
            </Card>
          </Link>
        )}

        <Card className="h-full border-dashed">
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">
              Outros módulos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Dashboards dos demais módulos serão disponibilizados nas próximas fases.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
