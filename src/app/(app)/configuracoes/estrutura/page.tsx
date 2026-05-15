import { requireAuth } from "@/lib/auth/session";
import { canManageOrgStructure, canViewOrgStructure } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { OrgStructurePanel } from "@/components/org/org-structure-panel";
import { getManagerCandidatesAction, getOrgStructureAction } from "@/server/actions/org";

export default async function EstruturaPage() {
  const session = await requireAuth();
  if (!canViewOrgStructure(session.profile)) {
    redirect("/");
  }

  const [structureResult, managersResult] = await Promise.all([
    getOrgStructureAction(),
    getManagerCandidatesAction(),
  ]);

  const sectors = structureResult.data ?? [];
  const managerCandidates = managersResult.data ?? [];
  const canManage = canManageOrgStructure(session.profile);

  return (
    <div className="space-y-4">
      {!canManage && (
        <p className="text-sm text-muted-foreground">
          Visualização somente leitura. Apenas gestores podem alterar a estrutura
          organizacional.
        </p>
      )}
      <OrgStructurePanel
        key={sectors.map((s) => s.id).join("-")}
        sectors={sectors}
        canManage={canManage}
        managerCandidates={managerCandidates}
      />
    </div>
  );
}
