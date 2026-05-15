import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboards</h1>
      <Card>
        <CardHeader>
          <CardTitle>Em desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Os dashboards por módulo serão disponibilizados nas próximas fases do projeto.
        </CardContent>
      </Card>
    </div>
  );
}
