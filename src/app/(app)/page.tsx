import { requireAuth } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const session = await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bem-vindo, {session.profile.full_name}</h1>
        <p className="text-muted-foreground">
          Plataforma de Gestão Imbil (Command Center)
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Visão geral</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Selecione um módulo no menu lateral ou acesse os dashboards disponíveis.
            Os módulos de negócio serão implementados nas próximas fases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
