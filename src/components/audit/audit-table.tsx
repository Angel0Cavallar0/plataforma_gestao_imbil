"use client";

import { useState } from "react";
import { deleteAuditLogAction } from "@/server/actions/audit";
import { Button } from "@/components/ui/button";

export interface AuditRow {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  user_id: string | null;
  created_at: string | null;
}

interface AuditTableProps {
  logs: AuditRow[];
  canDelete: boolean;
}

export function AuditTable({ logs, canDelete }: AuditTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <th className="p-3">Data</th>
            <th className="p-3">Ação</th>
            <th className="p-3">Recurso</th>
            <th className="p-3">ID recurso</th>
            <th className="p-3">Usuário</th>
            {canDelete && <th className="p-3">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t">
              <td className="p-3 whitespace-nowrap">
                {log.created_at
                  ? new Date(log.created_at).toLocaleString("pt-BR")
                  : "—"}
              </td>
              <td className="p-3">{log.action}</td>
              <td className="p-3">{log.resource_type}</td>
              <td className="p-3 font-mono text-xs">{log.resource_id ?? "—"}</td>
              <td className="p-3 font-mono text-xs">{log.user_id ?? "—"}</td>
              {canDelete && (
                <td className="p-3">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={loadingId === log.id}
                    onClick={async () => {
                      const confirm = window.prompt(
                        'Digite EXCLUIR para confirmar a exclusão deste log:',
                      );
                      if (confirm !== "EXCLUIR") return;
                      setLoadingId(log.id);
                      await deleteAuditLogAction(log.id, confirm);
                      setLoadingId(null);
                    }}
                  >
                    Excluir
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
