"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import {
  getUserAuditLogsAction,
  getUserDetailAction,
  updateUserAction,
  type UserAuditLogRow,
  type UserDetailData,
} from "@/server/actions/users";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROFILE_STATUSES } from "@/lib/constants";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50";

export interface UserDetailCatalog {
  roles: { id: string; name: string; slug: string }[];
  modules: { id: string; name: string }[];
  departments: {
    id: string;
    name: string;
    parent_id: string | null;
    responsible_id: string | null;
  }[];
  positions: { id: string; name: string; department_id: string | null }[];
  managers: { id: string; full_name: string }[];
}

interface UserDetailDialogProps {
  userId: string | null;
  onClose: () => void;
  canEdit: boolean;
  catalog: UserDetailCatalog;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value ?? "—"}</dd>
    </div>
  );
}

type Draft = {
  full_name: string;
  registration_number: string;
  role_id: string;
  department_id: string;
  sector_id: string;
  position_id: string;
  manager_id: string;
  admission_date: string;
  phone: string;
  whatsapp: string;
  status: string;
  must_change_password: boolean;
  module_ids: string[];
};

function buildDraft(
  detail: UserDetailData,
  departments: UserDetailCatalog["departments"],
): Draft {
  let department_id = "";
  let sector_id = "";
  if (detail.department_id) {
    const row = departments.find((x) => x.id === detail.department_id);
    if (row) {
      if (row.parent_id === null) {
        department_id = row.id;
      } else {
        department_id = row.parent_id;
        sector_id = row.id;
      }
    }
  }
  return {
    full_name: detail.full_name,
    registration_number: detail.registration_number,
    role_id: detail.role_id,
    department_id,
    sector_id,
    position_id: detail.position_id ?? "",
    manager_id: detail.manager_id ?? "",
    admission_date: detail.admission_date ? detail.admission_date.slice(0, 10) : "",
    phone: detail.phone ?? "",
    whatsapp: detail.whatsapp ?? "",
    status: detail.status,
    must_change_password: !!detail.must_change_password,
    module_ids: [...detail.module_ids],
  };
}

function UserDetailBody({
  userId,
  canEdit,
  catalog,
}: {
  userId: string;
  canEdit: boolean;
  catalog: UserDetailCatalog;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [detail, setDetail] = useState<UserDetailData | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [logs, setLogs] = useState<UserAuditLogRow[] | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsLoaded, setLogsLoaded] = useState(false);

  const topDepartments = useMemo(
    () => catalog.departments.filter((d) => d.parent_id === null),
    [catalog.departments],
  );

  const childSectors = useMemo(
    () => catalog.departments.filter((d) => d.parent_id === draft?.department_id),
    [catalog.departments, draft?.department_id],
  );

  const sectorPositions = useMemo(
    () => catalog.positions.filter((p) => p.department_id === draft?.sector_id),
    [catalog.positions, draft?.sector_id],
  );

  const selectedDepartment = catalog.departments.find(
    (d) => d.id === draft?.department_id,
  );

  const managerOptions = useMemo(
    () => catalog.managers.filter((m) => m.id !== userId),
    [catalog.managers, userId],
  );

  useEffect(() => {
    let cancelled = false;
    getUserDetailAction(userId).then((result) => {
      if (cancelled) return;
      if (result.error) {
        setDetailError(result.error);
        setDetail(null);
        setDraft(null);
      } else if (result.data) {
        setDetail(result.data);
        setDraft(buildDraft(result.data, catalog.departments));
        setDetailError(null);
      }
      setLoadingDetail(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, catalog.departments]);

  function handleDepartmentChange(nextDepartmentId: string) {
    if (!draft) return;
    setDraft((d) => {
      if (!d) return d;
      const dept = catalog.departments.find((x) => x.id === nextDepartmentId);
      const nextManager =
        dept?.responsible_id && dept.responsible_id !== userId ? dept.responsible_id : "";
      return {
        ...d,
        department_id: nextDepartmentId,
        sector_id: "",
        position_id: "",
        manager_id: nextManager,
      };
    });
  }

  function handleSectorChange(nextSectorId: string) {
    if (!draft) return;
    setDraft((d) => (d ? { ...d, sector_id: nextSectorId, position_id: "" } : d));
  }

  async function loadLogs() {
    if (loadingLogs || logsLoaded) return;
    setLoadingLogs(true);
    setLogsError(null);
    const result = await getUserAuditLogsAction(userId);
    if (result.error) {
      setLogsError(result.error);
    } else {
      setLogs(result.data ?? []);
    }
    setLogsLoaded(true);
    setLoadingLogs(false);
  }

  async function handleSave() {
    if (!draft) return;
    setSaveError(null);
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("id", userId);
      formData.set("full_name", draft.full_name);
      formData.set("registration_number", draft.registration_number);
      formData.set("role_id", draft.role_id);
      const profileDepartmentId = draft.sector_id || draft.department_id;
      formData.set("department_id", profileDepartmentId || "");
      formData.set("position_id", draft.position_id || "");
      formData.set("manager_id", draft.manager_id || "");
      formData.set("admission_date", draft.admission_date || "");
      formData.set("phone", draft.phone || "");
      formData.set("whatsapp", draft.whatsapp || "");
      formData.set("status", draft.status);
      if (draft.must_change_password) {
        formData.append("must_change_password", "on");
      }
      for (const mid of draft.module_ids) {
        formData.append("module_ids", mid);
      }

      const result = await updateUserAction(formData);
      if (typeof result.error === "string") {
        setSaveError(result.error);
      } else if (result.error) {
        setSaveError("Verifique os campos.");
      } else {
        const refreshed = await getUserDetailAction(userId);
        if (refreshed.data) {
          setDetail(refreshed.data);
          setDraft(buildDraft(refreshed.data, catalog.departments));
        }
        setEditing(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    if (detail) setDraft(buildDraft(detail, catalog.departments));
    setSaveError(null);
    setEditing(false);
  }

  function handleToggleEditMode() {
    if (editing) {
      handleCancelEdit();
    } else {
      setSaveError(null);
      setEditing(true);
    }
  }

  const headerRow = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:pr-8">
      <DialogHeader className="space-y-1.5 p-0 text-left sm:flex-1 sm:pr-4">
        <DialogTitle>Detalhes do usuário</DialogTitle>
        <DialogDescription>
          Informações completas e histórico de atividade
          {canEdit ? " — perfil Gerência ou superior pode editar." : ""}
        </DialogDescription>
      </DialogHeader>
      {canEdit && detail && draft && !loadingDetail && (
        <Button
          type="button"
          variant={editing ? "secondary" : "outline"}
          size="sm"
          className="shrink-0 gap-1.5 self-end sm:self-start"
          onClick={handleToggleEditMode}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          {editing ? "Cancelar edição" : "Editar"}
        </Button>
      )}
    </div>
  );

  if (loadingDetail) {
    return (
      <>
        {headerRow}
        <p className="text-sm text-muted-foreground">Carregando dados...</p>
      </>
    );
  }

  if (detailError) {
    return (
      <>
        {headerRow}
        <p className="text-sm text-destructive">{detailError}</p>
      </>
    );
  }

  if (!detail || !draft) {
    return (
      <>
        {headerRow}
        <p className="text-sm text-muted-foreground">Nenhum dado para exibir.</p>
      </>
    );
  }

  return (
    <>
      {headerRow}
      <Card className="border-border shadow-sm">
        <CardContent className="space-y-6 pt-6">
          {editing && saveError && (
            <p className="text-sm text-destructive">{saveError}</p>
          )}

          <section>
            <h4 className="mb-3 text-sm font-semibold">Identificação</h4>
            {editing ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="ud_full_name">Nome</Label>
                  <Input
                    id="ud_full_name"
                    value={draft.full_name}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, full_name: e.target.value } : d))
                    }
                    disabled={saving}
                  />
                </div>
                <DetailField label="E-mail" value={detail.email} />
                <div className="space-y-1">
                  <Label htmlFor="ud_registration">Matrícula</Label>
                  <Input
                    id="ud_registration"
                    value={draft.registration_number}
                    onChange={(e) =>
                      setDraft((d) =>
                        d ? { ...d, registration_number: e.target.value } : d,
                      )
                    }
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ud_status">Status</Label>
                  <select
                    id="ud_status"
                    value={draft.status}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, status: e.target.value } : d))
                    }
                    disabled={saving}
                    className={selectClassName}
                  >
                    {PROFILE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailField label="Nome" value={detail.full_name} />
                <DetailField label="E-mail" value={detail.email} />
                <DetailField label="Matrícula" value={detail.registration_number} />
                <DetailField
                  label="Status"
                  value={detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
                />
              </dl>
            )}
          </section>

          <section>
            <h4 className="mb-3 text-sm font-semibold">Perfil e organização</h4>
            {editing ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="ud_role">Nível de perfil</Label>
                  <select
                    id="ud_role"
                    value={draft.role_id}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, role_id: e.target.value } : d))
                    }
                    disabled={saving}
                    className={selectClassName}
                  >
                    {catalog.roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Departamento</Label>
                  <select
                    value={draft.department_id}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    disabled={saving || topDepartments.length === 0}
                    className={selectClassName}
                  >
                    <option value="">Selecione...</option>
                    {topDepartments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Setor</Label>
                  <select
                    value={draft.sector_id}
                    onChange={(e) => handleSectorChange(e.target.value)}
                    disabled={saving || !draft.department_id}
                    className={selectClassName}
                  >
                    <option value="">Selecione...</option>
                    {childSectors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Cargo</Label>
                  <select
                    value={draft.position_id}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, position_id: e.target.value } : d))
                    }
                    disabled={saving || !draft.sector_id}
                    className={selectClassName}
                  >
                    <option value="">Selecione...</option>
                    {sectorPositions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Gestor direto</Label>
                  <select
                    value={draft.manager_id}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, manager_id: e.target.value } : d))
                    }
                    disabled={saving}
                    className={selectClassName}
                  >
                    <option value="">Nenhum</option>
                    {managerOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name}
                      </option>
                    ))}
                  </select>
                  {selectedDepartment?.responsible_id &&
                    draft.manager_id === selectedDepartment.responsible_id && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Responsável do departamento.
                      </p>
                    )}
                </div>
              </div>
            ) : (
              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailField label="Nível de perfil" value={detail.role_name} />
                <DetailField label="Departamento" value={detail.department_name} />
                <DetailField label="Cargo" value={detail.position_name} />
                <DetailField label="Gestor" value={detail.manager_name} />
              </dl>
            )}
          </section>

          <section>
            <h4 className="mb-3 text-sm font-semibold">Contato</h4>
            {editing ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="ud_phone">Telefone</Label>
                  <Input
                    id="ud_phone"
                    value={draft.phone}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, phone: e.target.value } : d))
                    }
                    disabled={saving}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ud_whatsapp">WhatsApp</Label>
                  <Input
                    id="ud_whatsapp"
                    value={draft.whatsapp}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, whatsapp: e.target.value } : d))
                    }
                    disabled={saving}
                  />
                </div>
              </div>
            ) : (
              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailField label="Telefone" value={detail.phone} />
                <DetailField label="WhatsApp" value={detail.whatsapp} />
              </dl>
            )}
          </section>

          <section>
            <h4 className="mb-3 text-sm font-semibold">Datas e acesso</h4>
            {editing ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="ud_admission">Admissão</Label>
                  <Input
                    id="ud_admission"
                    type="date"
                    value={draft.admission_date}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, admission_date: e.target.value } : d))
                    }
                    disabled={saving}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="ud_must_pw"
                    type="checkbox"
                    checked={draft.must_change_password}
                    onChange={(e) =>
                      setDraft((d) =>
                        d ? { ...d, must_change_password: e.target.checked } : d,
                      )
                    }
                    disabled={saving}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="ud_must_pw" className="font-normal">
                    Deve trocar senha no próximo acesso
                  </Label>
                </div>
              </div>
            ) : null}
            <dl
              className={
                editing
                  ? "mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2"
                  : "grid gap-3 sm:grid-cols-2"
              }
            >
              <DetailField label="Criado em" value={formatDate(detail.created_at)} />
              {!editing && (
                <DetailField label="Admissão" value={formatDate(detail.admission_date)} />
              )}
              <DetailField
                label="Último login"
                value={
                  detail.last_login_at
                    ? formatDate(detail.last_login_at)
                    : "Nunca acessou"
                }
              />
              <DetailField
                label="Senha alterada em"
                value={formatDate(detail.password_changed_at)}
              />
              {detail.status === "inativo" && (
                <DetailField
                  label="Desativado em"
                  value={formatDate(detail.deactivated_at)}
                />
              )}
              {!editing && (
                <DetailField
                  label="Deve trocar senha"
                  value={detail.must_change_password ? "Sim" : "Não"}
                />
              )}
            </dl>
          </section>

          <section>
            <h4 className="mb-3 text-sm font-semibold">Módulos com acesso</h4>
            {editing ? (
              <div className="flex flex-wrap gap-2">
                {catalog.modules.map((m) => (
                  <label key={m.id} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.module_ids.includes(m.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setDraft((d) => {
                          if (!d) return d;
                          if (checked) {
                            return { ...d, module_ids: [...d.module_ids, m.id] };
                          }
                          return {
                            ...d,
                            module_ids: d.module_ids.filter((x) => x !== m.id),
                          };
                        });
                      }}
                      disabled={saving}
                      className="h-4 w-4 rounded border-input"
                    />
                    {m.name}
                  </label>
                ))}
              </div>
            ) : detail.module_names.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {detail.module_names.map((name) => (
                  <li
                    key={name}
                    className="rounded-md bg-muted px-2 py-1 text-xs font-medium"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum módulo atribuído</p>
            )}
          </section>

          <section>
            <h4 className="mb-3 text-sm font-semibold">E-mail</h4>
            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailField label="Último envio" value={detail.last_email_status ?? "—"} />
              <DetailField
                label="Data do último e-mail"
                value={formatDate(detail.last_email_at)}
              />
            </dl>
          </section>

          <section>
            <h4 className="mb-3 text-sm font-semibold">Logs de auditoria</h4>
            {!logsLoaded && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loadingLogs}
                onClick={loadLogs}
              >
                {loadingLogs ? "Carregando..." : "Ver últimos logs"}
              </Button>
            )}
            {logsError && <p className="mt-2 text-sm text-destructive">{logsError}</p>}
            {logsLoaded && logs && logs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum log encontrado para este usuário.
              </p>
            )}
            {logs && logs.length > 0 && (
              <div className="mt-3 max-h-48 overflow-y-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/50">
                    <tr className="text-left">
                      <th className="p-2 font-medium">Data</th>
                      <th className="p-2 font-medium">Ação</th>
                      <th className="p-2 font-medium">Recurso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-t">
                        <td className="whitespace-nowrap p-2">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="p-2">{log.action}</td>
                        <td className="p-2">
                          {log.resource_type}
                          {log.resource_id ? ` · ${log.resource_id.slice(0, 8)}…` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {canEdit && editing && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={handleCancelEdit}
              >
                Descartar
              </Button>
              <Button type="button" disabled={saving} onClick={handleSave}>
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export function UserDetailDialog({
  userId,
  onClose,
  canEdit,
  catalog,
}: UserDetailDialogProps) {
  const open = userId !== null;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-1.5rem,56rem)] max-w-[56rem] gap-4 overflow-y-auto">
        {userId && (
          <UserDetailBody
            key={userId}
            userId={userId}
            canEdit={canEdit}
            catalog={catalog}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
