"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  createDepartmentAction,
  createPositionAction,
  createSectorAction,
  deleteDepartmentAction,
  deletePositionAction,
  getDepartmentDetailAction,
  type DepartmentDetailData,
  type ManagerCandidate,
  type OrgSectorRow,
  updateDepartmentAction,
  updateSectorAction,
} from "@/server/actions/org";
import { OrgEntityDialog } from "@/components/org/org-entity-dialog";

interface OrgStructurePanelProps {
  sectors: OrgSectorRow[];
  canManage: boolean;
  managerCandidates: ManagerCandidate[];
}

type DialogMode =
  | { type: "sector-create" }
  | { type: "sector-edit"; id: string; name: string }
  | { type: "department-create"; parentId?: string }
  | {
      type: "department-edit";
      id: string;
      parentId: string;
      name: string;
      responsibleName: string | null;
      responsibleId: string | null;
    }
  | { type: "position-create"; departmentId: string }
  | null;

export function OrgStructurePanel({
  sectors,
  canManage,
  managerCandidates,
}: OrgStructurePanelProps) {
  const router = useRouter();
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(
    () => new Set(sectors.map((s) => s.id)),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DepartmentDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const managerOptions = managerCandidates.map((m) => ({
    id: m.id,
    label: m.full_name,
  }));

  const sectorOptions = sectors.map((s) => ({ id: s.id, label: s.name }));

  const allDepartments = sectors.flatMap((s) =>
    s.departments.map((d) => ({ id: d.id, label: `${d.name} (${s.name})` })),
  );

  const loadDetail = useCallback(async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setDetailError(null);
    const result = await getDepartmentDetailAction(id);
    if (result.error) {
      setDetailError(result.error);
      setDetail(null);
    } else if (result.data) {
      setDetail(result.data);
    }
    setDetailLoading(false);
  }, []);

  function refresh() {
    router.refresh();
    if (selectedId) loadDetail(selectedId);
  }

  function toggleSector(id: string) {
    setExpandedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete(id: string) {
    setActionError(null);
    const formData = new FormData();
    formData.set("id", id);
    const result = await deleteDepartmentAction(formData);
    if (result.error) {
      setActionError(
        typeof result.error === "string" ? result.error : "Erro ao excluir.",
      );
    } else {
      setSelectedId(null);
      setDetail(null);
      refresh();
    }
  }

  async function handleDeletePosition(id: string) {
    setActionError(null);
    const result = await deletePositionAction(id);
    if (result.error) {
      setActionError(result.error);
    } else {
      refresh();
    }
  }

  const isSectorSelected = sectors.some((s) => s.id === selectedId);

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setDialogMode({ type: "sector-create" })}>
            Novo setor
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialogMode({ type: "department-create" })}
            disabled={sectorOptions.length === 0}
          >
            Novo departamento
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium">Setores e departamentos</h2>
          </div>
          {sectors.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Nenhum setor cadastrado.
              {canManage && ' Clique em "Novo setor" para começar.'}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {sectors.map((sector) => (
                <li key={sector.id}>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => toggleSector(sector.id)}
                      className="p-2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        expandedSectors.has(sector.id) ? "Recolher" : "Expandir"
                      }
                    >
                      {expandedSectors.has(sector.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => loadDetail(sector.id)}
                      className={cn(
                        "flex flex-1 items-center gap-2 px-2 py-2.5 text-left text-sm transition-colors hover:bg-muted/50",
                        selectedId === sector.id && "bg-muted font-medium",
                      )}
                    >
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1">{sector.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {sector.departments.length} dept.
                      </span>
                    </button>
                  </div>
                  {expandedSectors.has(sector.id) && (
                    <ul className="border-t border-border bg-muted/20">
                      {sector.departments.length === 0 ? (
                        <li className="px-4 py-2 text-xs text-muted-foreground">
                          Sem departamentos
                        </li>
                      ) : (
                        sector.departments.map((dept) => (
                          <li key={dept.id}>
                            <button
                              type="button"
                              onClick={() => loadDetail(dept.id)}
                              className={cn(
                                "flex w-full items-center gap-2 py-2 pl-10 pr-4 text-left text-sm transition-colors hover:bg-muted/50",
                                selectedId === dept.id && "bg-muted font-medium",
                              )}
                            >
                              <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="flex-1">{dept.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {dept.member_count}
                              </span>
                            </button>
                          </li>
                        ))
                      )}
                      {canManage && (
                        <li className="px-4 py-2">
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={() =>
                              setDialogMode({
                                type: "department-create",
                                parentId: sector.id,
                              })
                            }
                          >
                            + Adicionar departamento
                          </button>
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card min-h-[320px]">
          {!selectedId ? (
            <p className="p-6 text-sm text-muted-foreground">
              Selecione um setor ou departamento para ver os detalhes.
            </p>
          ) : detailLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Carregando...</p>
          ) : detailError ? (
            <p className="p-6 text-sm text-destructive">{detailError}</p>
          ) : detail ? (
            <DepartmentDetailView
              detail={detail}
              isSector={isSectorSelected}
              canManage={canManage}
              actionError={actionError}
              onEdit={() => {
                if (isSectorSelected) {
                  setDialogMode({
                    type: "sector-edit",
                    id: detail.id,
                    name: detail.name,
                  });
                } else if (detail.parent_id) {
                  setDialogMode({
                    type: "department-edit",
                    id: detail.id,
                    parentId: detail.parent_id,
                    name: detail.name,
                    responsibleName: detail.responsible_name,
                    responsibleId: detail.responsible_id,
                  });
                }
              }}
              onDelete={() => handleDelete(detail.id)}
              onAddPosition={() =>
                setDialogMode({ type: "position-create", departmentId: detail.id })
              }
              onDeletePosition={handleDeletePosition}
            />
          ) : null}
        </div>
      </div>

      {dialogMode?.type === "sector-create" && (
        <OrgEntityDialog
          open
          onOpenChange={(open) => !open && setDialogMode(null)}
          title="Novo setor"
          description="Setores agrupam departamentos da empresa."
          submitLabel="Criar setor"
          fields={{ name: { label: "Nome do setor" } }}
          onSubmit={async (fd) => {
            const r = await createSectorAction(fd);
            if (r.success) refresh();
            return r;
          }}
        />
      )}

      {dialogMode?.type === "sector-edit" && (
        <OrgEntityDialog
          open
          onOpenChange={(open) => !open && setDialogMode(null)}
          title="Editar setor"
          description="Altere o nome do setor."
          submitLabel="Salvar"
          fields={{
            hidden: { id: dialogMode.id },
            name: { label: "Nome do setor", defaultValue: dialogMode.name },
          }}
          onSubmit={async (fd) => {
            const r = await updateSectorAction(fd);
            if (r.success) refresh();
            return r;
          }}
        />
      )}

      {dialogMode?.type === "department-create" && (
        <OrgEntityDialog
          open
          onOpenChange={(open) => !open && setDialogMode(null)}
          title="Novo departamento"
          description="Departamentos pertencem a um setor."
          submitLabel="Criar departamento"
          fields={{
            name: { label: "Nome do departamento" },
            parentId: {
              options: sectorOptions,
              defaultValue: dialogMode.parentId,
            },
            responsibleName: {},
            responsibleId: { options: managerOptions },
          }}
          onSubmit={async (fd) => {
            const r = await createDepartmentAction(fd);
            if (r.success) refresh();
            return r;
          }}
        />
      )}

      {dialogMode?.type === "department-edit" && (
        <OrgEntityDialog
          open
          onOpenChange={(open) => !open && setDialogMode(null)}
          title="Editar departamento"
          description="Atualize os dados do departamento."
          submitLabel="Salvar"
          fields={{
            hidden: { id: dialogMode.id },
            name: { label: "Nome do departamento", defaultValue: dialogMode.name },
            parentId: {
              options: sectorOptions,
              defaultValue: dialogMode.parentId,
            },
            responsibleName: { defaultValue: dialogMode.responsibleName ?? "" },
            responsibleId: {
              options: managerOptions,
              defaultValue: dialogMode.responsibleId ?? "",
            },
          }}
          onSubmit={async (fd) => {
            const r = await updateDepartmentAction(fd);
            if (r.success) refresh();
            return r;
          }}
        />
      )}

      {dialogMode?.type === "position-create" && (
        <OrgEntityDialog
          open
          onOpenChange={(open) => !open && setDialogMode(null)}
          title="Novo cargo"
          description="Cargos são vinculados a um departamento."
          submitLabel="Criar cargo"
          fields={{
            name: { label: "Nome do cargo" },
            departmentId: {
              options: allDepartments,
              defaultValue: dialogMode.departmentId,
            },
          }}
          onSubmit={async (fd) => {
            const r = await createPositionAction(fd);
            if (r.success) refresh();
            return r;
          }}
        />
      )}
    </div>
  );
}

function DepartmentDetailView({
  detail,
  isSector,
  canManage,
  actionError,
  onEdit,
  onDelete,
  onAddPosition,
  onDeletePosition,
}: {
  detail: DepartmentDetailData;
  isSector: boolean;
  canManage: boolean;
  actionError: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onAddPosition: () => void;
  onDeletePosition: (id: string) => void;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{detail.name}</h2>
          <p className="text-sm text-muted-foreground">
            {isSector ? "Setor" : `Departamento · ${detail.parent_name ?? "—"}`}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              Editar
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              Excluir
            </Button>
          </div>
        )}
      </div>

      {!isSector && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium">Responsável</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Nome</dt>
              <dd>{detail.responsible_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Usuário vinculado</dt>
              <dd>{detail.responsible_profile_name ?? "—"}</dd>
            </div>
          </dl>
        </section>
      )}

      {!isSector && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Cargos</h3>
            {canManage && (
              <Button size="sm" variant="outline" onClick={onAddPosition}>
                Novo cargo
              </Button>
            )}
          </div>
          {detail.positions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cargo cadastrado.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {detail.positions.map((pos) => (
                <li
                  key={pos.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span>{pos.name}</span>
                  {canManage && (
                    <button
                      type="button"
                      className="text-xs text-destructive hover:underline"
                      onClick={() => onDeletePosition(pos.id)}
                    >
                      Excluir
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-medium">
          Colaboradores vinculados ({detail.members.length})
        </h3>
        {detail.members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isSector
              ? "Colaboradores são vinculados aos departamentos, não ao setor."
              : "Nenhum colaborador neste departamento."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="px-3 py-2 font-medium">Nome</th>
                  <th className="px-3 py-2 font-medium">Cargo</th>
                  <th className="px-3 py-2 font-medium">Gestor</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {detail.members.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">{m.full_name}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {m.position_name ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {m.manager_name ?? "—"}
                    </td>
                    <td className="px-3 py-2 capitalize">{m.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}
    </div>
  );
}
