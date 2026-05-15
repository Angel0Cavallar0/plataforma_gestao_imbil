import { MODULES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ModulosConfigPage() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Parâmetros específicos de cada módulo serão definidos nos documentos de cada fase.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((mod) => (
          <Card key={mod.slug}>
            <CardHeader>
              <CardTitle className="text-base">{mod.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Placeholder — configurações em breve.
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
