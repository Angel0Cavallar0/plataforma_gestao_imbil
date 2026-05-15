"use client";

import { useState } from "react";
import {
  unlockUserAction,
  requestPasswordResetAction,
  deactivateUserAction,
} from "@/server/actions/users";
import { Button } from "@/components/ui/button";
import { UserDetailDialog } from "@/components/users/user-detail-dialog";
import type { NavPermissions } from "@/types/auth";

export interface UserRow {
  id: string;
  full_name: string;
  email: string;
  registration_number: string;
  status: string;
  role_name: string;
  last_email_status: string | null;
}

interface UsersTableProps {
  users: UserRow[];
  nav: NavPermissions;
}

export function UsersTable({ users, nav }: UsersTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  async function runAction(id: string, fn: () => Promise<unknown>) {
    setLoadingId(id);
    await fn();
    setLoadingId(null);
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3 font-medium">Nome</th>
              <th className="p-3 font-medium">E-mail</th>
              <th className="p-3 font-medium">Matrícula</th>
              <th className="p-3 font-medium">Nível</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">E-mail envio</th>
              <th className="p-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-t cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setSelectedUserId(u.id)}
              >
                <td className="p-3">{u.full_name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.registration_number}</td>
                <td className="p-3">{u.role_name}</td>
                <td className="p-3 capitalize">{u.status}</td>
                <td className="p-3">{u.last_email_status ?? "—"}</td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-wrap gap-1">
                    {(u.status === "bloqueado" || u.status === "ativo") && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loadingId === u.id}
                        onClick={() =>
                          runAction(u.id, () =>
                            u.status === "bloqueado"
                              ? unlockUserAction(u.id)
                              : requestPasswordResetAction(u.id, "reset"),
                          )
                        }
                      >
                        {u.status === "bloqueado" ? "Desbloquear" : "Trocar senha"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === u.id}
                      onClick={() =>
                        runAction(u.id, () => requestPasswordResetAction(u.id, "setup"))
                      }
                    >
                      Reenviar cadastro
                    </Button>
                    {nav.canManageUsers && u.status === "ativo" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={loadingId === u.id}
                        onClick={() => runAction(u.id, () => deactivateUserAction(u.id))}
                      >
                        Desativar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <UserDetailDialog userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
    </>
  );
}
