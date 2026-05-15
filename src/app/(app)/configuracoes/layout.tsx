import { ConfigNav } from "@/components/config/config-nav";
import { requireAuth } from "@/lib/auth/session";
import { canAccessConfig } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";

export default async function ConfigLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  if (!canAccessConfig(session.profile)) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Administração da plataforma — acesso para supervisão ou superior
        </p>
      </div>
      <ConfigNav />
      {children}
    </div>
  );
}
