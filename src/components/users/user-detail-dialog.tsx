"use client";

import { useEffect, useState } from "react";
import {
  getUserAuditLogsAction,
  getUserDetailAction,
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

interface UserDetailDialogProps {
  userId: string | null;
  onClose: () => void;
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

function UserDetailBody({ userId }: { userId: string }) {
  const [detail, setDetail] = useState<UserDetailData | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  const [logs, setLogs] = useState<UserAuditLogRow[] | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsLoaded, setLogsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getUserDetailAction(userId).then((result) => {
      if (cancelled) return;
      if (result.error) {
        setDetailError(result.error);
        setDetail(null);
      } else if (result.data) {
        setDetail(result.data);
        setDetailError(null);
      }
      setLoadingDetail(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

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

  if (loadingDetail) {
    return <p className="text-sm text-muted-foreground">Carregando dados...</p>;
  }

  if (detailError) {
    return <p className="text-sm text-destructive">{detailError}</p>;
  }

  if (!detail) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section>
        <h4 className="mb-3 text-sm font-semibold">Identificação</h4>
        <dl className="grid gap-3 sm:grid-cols-2">
          <DetailField label="Nome" value={detail.full_name} />
          <DetailField label="E-mail" value={detail.email} />
          <DetailField label="Matrícula" value={detail.registration_number} />
          <DetailField
            label="Status"
            value={detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
          />
        </dl>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-semibold">Perfil e organização</h4>
        <dl className="grid gap-3 sm:grid-cols-2">
          <DetailField label="Nível de perfil" value={detail.role_name} />
          <DetailField label="Departamento" value={detail.department_name} />
          <DetailField label="Cargo" value={detail.position_name} />
          <DetailField label="Gestor" value={detail.manager_name} />
        </dl>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-semibold">Contato</h4>
        <dl className="grid gap-3 sm:grid-cols-2">
          <DetailField label="Telefone" value={detail.phone} />
          <DetailField label="WhatsApp" value={detail.whatsapp} />
        </dl>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-semibold">Datas e acesso</h4>
        <dl className="grid gap-3 sm:grid-cols-2">
          <DetailField label="Criado em" value={formatDate(detail.created_at)} />
          <DetailField label="Admissão" value={formatDate(detail.admission_date)} />
          <DetailField
            label="Último login"
            value={
              detail.last_login_at ? formatDate(detail.last_login_at) : "Nunca acessou"
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
          <DetailField
            label="Deve trocar senha"
            value={detail.must_change_password ? "Sim" : "Não"}
          />
        </dl>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-semibold">Módulos com acesso</h4>
        {detail.module_names.length > 0 ? (
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
              <thead className="bg-muted/50 sticky top-0">
                <tr className="text-left">
                  <th className="p-2 font-medium">Data</th>
                  <th className="p-2 font-medium">Ação</th>
                  <th className="p-2 font-medium">Recurso</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="p-2 whitespace-nowrap">
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
    </div>
  );
}

export function UserDetailDialog({ userId, onClose }: UserDetailDialogProps) {
  const open = userId !== null;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do usuário</DialogTitle>
          <DialogDescription>
            Informações completas e histórico de atividade
          </DialogDescription>
        </DialogHeader>
        {userId && <UserDetailBody key={userId} userId={userId} />}
      </DialogContent>
    </Dialog>
  );
}
