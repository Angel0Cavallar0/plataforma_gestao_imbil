import Link from "next/link";
import { MODULES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ModulosConfigPage() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Parâmetros específicos de cada módulo.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((mod) => (
          <Card key={mod.slug}>
            <CardHeader>
              <CardTitle className="text-base">{mod.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {mod.slug === "marketing" ? (
                <Link
                  href="/configuracoes/modulos/marketing/integracoes"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Integrações Meta
                </Link>
              ) : (
                <span>Configurações em breve.</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
