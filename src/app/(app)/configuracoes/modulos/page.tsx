import Link from "next/link";
import { MODULES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModuleItem = { label: string; href: string };

/** Itens de parâmetro por módulo. Módulos sem itens exibem "Em breve". */
const MODULE_ITEMS: Record<string, ModuleItem[]> = {
  marketing: [
    {
      label: "Integrações e contas de anúncio",
      href: "/configuracoes/modulos/marketing/integracoes",
    },
    {
      label: "Relatórios (webhook de IA)",
      href: "/configuracoes/modulos/marketing/relatorios",
    },
  ],
};

export default function ModulosConfigPage() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Parâmetros específicos de cada módulo.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((mod) => {
          const items = MODULE_ITEMS[mod.slug] ?? [];
          return (
            <Card key={mod.slug}>
              <CardHeader>
                <CardTitle className="text-base">{mod.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {items.length > 0 ? (
                    items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "w-full justify-start",
                          )}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li>
                      <span
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "pointer-events-none w-full justify-start opacity-60",
                        )}
                        aria-disabled="true"
                      >
                        Em breve
                      </span>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
