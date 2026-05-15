import { MODULES } from "@/lib/constants";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ModuloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mod = MODULES.find((m) => m.slug === slug);
  if (!mod) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{mod.name}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Módulo em construção</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          O módulo {mod.name} será implementado em uma fase posterior. Esta rota serve como
          placeholder na estrutura da plataforma.
        </CardContent>
      </Card>
    </div>
  );
}
